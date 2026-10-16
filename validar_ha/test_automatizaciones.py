"""Valida el YAML del generador con Home Assistant real y simula su comportamiento.

No hay dispositivos: las entidades son estados fijados a mano y las acciones (light.turn_on,
notificaciones…) se sustituyen por servicios simulados que registran las llamadas.
Ver README.md («Validación con Home Assistant») para ejecutarlo.
"""

import asyncio
import json
import pathlib
import subprocess
import sys
from datetime import datetime, timedelta

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from homeassistant.util.yaml import parse_yaml
from pytest_homeassistant_custom_component.common import async_fire_time_changed, async_mock_service

HERE = pathlib.Path(__file__).parent
CASES = json.loads((HERE / "casos.json").read_text(encoding="utf-8"))


async def settle(hass: HomeAssistant) -> None:
    """Deja correr el bucle. No usamos async_block_till_done porque espera a las automatizaciones
    que están paradas en wait_for_trigger o delay, que es justo lo que queremos observar."""
    for _ in range(20):
        await asyncio.sleep(0)


@pytest.fixture
def expected_lingering_timers() -> bool:
    # Los disparadores horarios y los delay dejan temporizadores programados al acabar el test.
    return True


async def setup(hass: HomeAssistant, name: str) -> dict:
    config = parse_yaml(CASES[name]["yaml"])
    assert isinstance(config, dict)
    assert await async_setup_component(hass, "automation", {"automation": [config]})
    await hass.async_block_till_done()
    ids = hass.states.async_entity_ids("automation")
    assert len(ids) == 1, f"{name}: Home Assistant no ha creado la automatización"
    assert hass.states.get(ids[0]).state == "on"
    return config


async def advance(hass: HomeAssistant, freezer, **delta) -> None:
    freezer.tick(timedelta(**delta))
    async_fire_time_changed(hass)
    await settle(hass)


@pytest.mark.parametrize("name", sorted(CASES))
async def test_todos_los_casos_cargan(hass: HomeAssistant, name: str) -> None:
    config = await setup(hass, name)
    assert config["alias"] == CASES[name]["values"]["alias"]


async def test_a_movimiento_enciende_espera_y_apaga(hass: HomeAssistant, freezer) -> None:
    on = async_mock_service(hass, "light", "turn_on")
    off = async_mock_service(hass, "light", "turn_off")
    hass.states.async_set("sun.sun", "below_horizon")
    hass.states.async_set("binary_sensor.movimiento_pasillo", "off")
    await setup(hass, "a_ejemplo")

    hass.states.async_set("binary_sensor.movimiento_pasillo", "on")
    await settle(hass)
    assert len(on) == 1
    assert on[0].data == {"entity_id": ["light.pasillo"], "brightness_pct": 60}

    # Mientras sigue detectando no se apaga, aunque pase tiempo.
    await advance(hass, freezer, minutes=10)
    assert not off

    hass.states.async_set("binary_sensor.movimiento_pasillo", "off")
    await settle(hass)
    await advance(hass, freezer, minutes=1)
    assert not off, "no debe apagar antes de los 2 minutos"

    # Movimiento durante la espera: modo restart, vuelve a encender y la cuenta empieza de cero.
    hass.states.async_set("binary_sensor.movimiento_pasillo", "on")
    await settle(hass)
    assert len(on) == 2
    hass.states.async_set("binary_sensor.movimiento_pasillo", "off")
    await settle(hass)
    await advance(hass, freezer, minutes=1, seconds=30)
    assert not off
    await advance(hass, freezer, seconds=31)
    assert len(off) == 1
    assert off[0].data == {"entity_id": ["light.pasillo"]}


async def test_a_de_dia_no_enciende(hass: HomeAssistant) -> None:
    on = async_mock_service(hass, "light", "turn_on")
    hass.states.async_set("sun.sun", "above_horizon")
    hass.states.async_set("binary_sensor.movimiento_pasillo", "off")
    await setup(hass, "a_ejemplo")
    hass.states.async_set("binary_sensor.movimiento_pasillo", "on")
    await settle(hass)
    assert not on


async def test_a_enchufe_sin_espera(hass: HomeAssistant) -> None:
    on = async_mock_service(hass, "switch", "turn_on")
    off = async_mock_service(hass, "switch", "turn_off")
    hass.states.async_set("binary_sensor.movimiento_pasillo", "off")
    await setup(hass, "a_enchufe_sin_espera")
    hass.states.async_set("binary_sensor.movimiento_pasillo", "on")
    await settle(hass)
    hass.states.async_set("binary_sensor.movimiento_pasillo", "off")
    await settle(hass)
    assert len(on) == 1 and len(off) == 1
    assert off[0].data == {"entity_id": ["switch.enchufe_pasillo"]}


async def test_b_umbral_con_espera_y_sin_repetir(hass: HomeAssistant, freezer) -> None:
    calls = async_mock_service(hass, "persistent_notification", "create")
    hass.states.async_set("sensor.temperatura_salon", "25")
    await setup(hass, "b_ejemplo")

    hass.states.async_set("sensor.temperatura_salon", "30")
    await settle(hass)
    await advance(hass, freezer, minutes=9)
    assert not calls, "debe esperar 10 minutos por encima"
    await advance(hass, freezer, minutes=1, seconds=1)
    assert len(calls) == 1
    assert calls[0].data["title"] == "Aviso de Home Assistant"
    assert calls[0].data["message"].endswith("Valor actual: 30")

    # Sigue por encima: no repite.
    hass.states.async_set("sensor.temperatura_salon", "31")
    await settle(hass)
    await advance(hass, freezer, minutes=15)
    assert len(calls) == 1

    # Pico breve: baja, sube y vuelve a bajar antes de 10 min, no avisa.
    hass.states.async_set("sensor.temperatura_salon", "20")
    hass.states.async_set("sensor.temperatura_salon", "29")
    await settle(hass)
    await advance(hass, freezer, minutes=5)
    hass.states.async_set("sensor.temperatura_salon", "27")
    await settle(hass)
    await advance(hass, freezer, minutes=10)
    assert len(calls) == 1


async def test_b_movil_por_debajo(hass: HomeAssistant) -> None:
    calls = async_mock_service(hass, "notify", "send_message")
    hass.states.async_set("sensor.temperatura_salon", "5")
    await setup(hass, "b_movil_por_debajo")
    hass.states.async_set("sensor.temperatura_salon", "-3")
    await settle(hass)
    assert len(calls) == 1
    assert calls[0].data["entity_id"] == ["notify.mobile_app_pixel"]
    assert "title" not in calls[0].data
    assert calls[0].data["message"].endswith("Valor actual: -3")


def local(*args) -> datetime:
    return datetime(*args, tzinfo=dt_util.get_default_time_zone())


async def test_c_hora_todos_los_dias(hass: HomeAssistant, freezer) -> None:
    off = async_mock_service(hass, "light", "turn_off")
    freezer.move_to(local(2026, 10, 19, 23, 59, 0))
    await setup(hass, "c_ejemplo")
    await advance(hass, freezer, seconds=59)
    assert not off
    await advance(hass, freezer, seconds=1)
    assert len(off) == 1
    assert off[0].data == {"entity_id": ["light.jardin"]}


async def test_c_solo_lunes_y_viernes(hass: HomeAssistant, freezer) -> None:
    on = async_mock_service(hass, "light", "turn_on")
    freezer.move_to(local(2026, 10, 20, 7, 29, 0))  # martes
    await setup(hass, "c_dias_encender")
    await advance(hass, freezer, minutes=1)
    assert not on, "el martes no debe ejecutarse"
    freezer.move_to(local(2026, 10, 23, 7, 29, 0))  # viernes
    await advance(hass, freezer, minutes=1)
    assert len(on) == 1
    assert on[0].data == {"entity_id": ["light.jardin"], "brightness_pct": 80}


def test_check_config_con_archivo_propio(tmp_path: pathlib.Path) -> None:
    """Formato «archivo propio»: comprobador oficial de configuración (hass --script check_config)."""
    (tmp_path / "configuration.yaml").write_text(
        "automation: !include automations.yaml\n"
        "automation domotica_facil: !include automatizaciones_domotica_facil.yaml\n",
        encoding="utf-8",
    )
    (tmp_path / "automations.yaml").write_text("[]\n", encoding="utf-8")
    (tmp_path / "automatizaciones_domotica_facil.yaml").write_text(
        "".join(c["listYaml"] for c in CASES.values()), encoding="utf-8"
    )
    result = subprocess.run(
        [sys.executable, "-m", "homeassistant", "--script", "check_config", "-c", str(tmp_path)],
        capture_output=True, text=True, timeout=300,
    )
    print(result.stdout)
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Failed config" not in result.stdout

