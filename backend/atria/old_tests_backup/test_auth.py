def test_revoke_access_token(client, admin_headers):
    resp = client.delete("/api/auth/revoke_access", headers=admin_headers)
    assert resp.status_code == 200

    resp = client.get("/api/users/me", headers=admin_headers)
    assert resp.status_code == 401


def test_revoke_refresh_token(client, admin_refresh_headers):
    resp = client.delete("/api/auth/revoke_refresh", headers=admin_refresh_headers)
    assert resp.status_code == 200

    resp = client.post("/api/auth/refresh", headers=admin_refresh_headers)
    assert resp.status_code == 401
