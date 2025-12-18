import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    # snapshot and restore the in-memory activities dict to keep tests isolated
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(original)


def test_get_activities_returns_200_and_json():
    client = TestClient(app_module.app)
    r = client.get("/activities")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


def test_signup_adds_participant():
    test_email = "test.user@example.com"
    activity = "Chess Club"
    client = TestClient(app_module.app)

    post = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert post.status_code == 200

    get = client.get("/activities")
    data = get.json()
    assert test_email in data[activity]["participants"]


def test_unregister_removes_participant():
    # ensure a participant exists first
    test_email = "temp.remove@example.com"
    activity = "Basketball"
    # add directly to model
    app_module.activities.setdefault(activity, {}).setdefault("participants", []).append(test_email)

    client = TestClient(app_module.app)
    delete = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert delete.status_code == 200

    get = client.get("/activities")
    data = get.json()
    assert test_email not in data[activity]["participants"]
