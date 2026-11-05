from fastapi.testclient import TestClient

from app.main import app


def test_rutas_protegidas_sin_token():
    c = TestClient(app)
    for ruta in ["/api/productos", "/api/pedidos", "/api/insumos", "/api/dashboard", "/api/usuarios"]:
        assert c.get(ruta).status_code == 401, ruta


def test_catalogo_crud_slug_y_publico(admin):
    cat = admin.post("/api/categorias", json={"nombre": "Fresas con Chocolate"}).json()
    assert cat["slug"] == "fresas-con-chocolate"

    p1 = admin.post("/api/productos", json={"nombre": "Caja Corazón", "precio": 25.5, "categoria_id": cat["id"]}).json()
    p2 = admin.post("/api/productos", json={"nombre": "Caja Corazón", "precio": 30}).json()
    assert p1["precio"] == 25.5 and isinstance(p1["precio"], float)
    assert p2["slug"] == "caja-corazon-2"

    assert admin.post("/api/productos", json={"nombre": "X", "precio": 1, "categoria_id": 999}).status_code == 422
    assert admin.post("/api/productos", json={"nombre": "X", "precio": -1}).status_code == 422

    r = admin.patch(f"/api/productos/{p2['id']}", json={"activo": False, "precio": 28})
    assert r.json()["precio"] == 28 and r.json()["activo"] is False

    assert len(admin.get("/api/productos", params={"q": "corazón"}).json()) == 2
    assert len(admin.get("/api/productos", params={"activo": True}).json()) == 1

    pub = TestClient(app).get("/api/publico/catalogo").json()
    assert [p["nombre"] for p in pub["productos"]] == ["Caja Corazón"]

    # categoría usada por un producto: no se borra el producto, se pone NULL
    assert admin.delete(f"/api/categorias/{cat['id']}").status_code == 204
    assert admin.get(f"/api/productos/{p1['id']}").json()["categoria_id"] is None


def test_pedido_totales_y_estado_pago(admin):
    zona = admin.post("/api/zonas", json={"nombre": "Norte", "costo_envio": 3}).json()
    prod = admin.post("/api/productos", json={"nombre": "Arreglo", "precio": 20}).json()
    pedido = {
        "cliente_nombre": "Ana", "cliente_telefono": "0991234567", "zona_id": zona["id"],
        "monto_pagado": 10, "fecha_entrega": "2026-11-10T15:00:00-05:00",
        "items": [
            {"producto_id": prod["id"], "descripcion": "Arreglo", "cantidad": 2, "precio_unitario": 20,
             "personalizacion": {"nombre": "Luis", "colores": ["rojo"]}},
            {"descripcion": "Globo extra", "cantidad": 1, "precio_unitario": 2.5},
        ],
    }
    p = admin.post("/api/pedidos", json=pedido).json()
    assert (p["subtotal"], p["costo_envio"], p["total"]) == (42.5, 3, 45.5)
    assert p["estado_pago"] == "abonado" and p["zona_nombre"] == "Norte"

    p = admin.patch(f"/api/pedidos/{p['id']}/estado", json={"monto_pagado": 45.5, "estado": "confirmado"}).json()
    assert (p["estado_pago"], p["estado"]) == ("pagado", "confirmado")

    pedido["items"] = [{"descripcion": "Solo uno", "cantidad": 1, "precio_unitario": 10}]
    pedido["costo_envio"] = 0
    p = admin.put(f"/api/pedidos/{p['id']}", json=pedido).json()
    assert p["total"] == 10 and len(p["items"]) == 1 and p["estado_pago"] == "pagado"

    assert len(admin.get("/api/pedidos", params={"q": "ana"}).json()) == 1
    assert len(admin.get("/api/pedidos", params={"desde": "2026-11-10", "hasta": "2026-11-10"}).json()) == 1
    assert len(admin.get("/api/pedidos", params={"desde": "2026-11-11"}).json()) == 0
    assert admin.post("/api/pedidos", json={**pedido, "items": []}).status_code == 422


def test_compras_stock_costo_promedio_y_movimientos(admin):
    choco = admin.post("/api/insumos", json={"nombre": "Chocolate", "unidad": "kg", "stock_minimo": 2}).json()
    prov = admin.post("/api/proveedores", json={"nombre": "Distribuidora", "ruc": "1790012345001"}).json()

    c1 = admin.post("/api/compras", json={
        "proveedor_id": prov["id"], "fecha": "2026-11-01",
        "items": [{"materia_prima_id": choco["id"], "cantidad": 10, "costo_unitario": 8}],
    }).json()
    assert c1["total"] == 80 and c1["proveedor_nombre"] == "Distribuidora"
    admin.post("/api/compras", json={"fecha": "2026-11-02",
        "items": [{"materia_prima_id": choco["id"], "cantidad": 10, "costo_unitario": 10}]})

    ins = admin.get(f"/api/insumos/{choco['id']}").json()
    assert ins["stock_actual"] == 20 and ins["costo_promedio"] == 9

    assert admin.post("/api/movimientos", json={"materia_prima_id": choco["id"], "tipo": "salida", "cantidad": 19}).status_code == 201
    r = admin.post("/api/movimientos", json={"materia_prima_id": choco["id"], "tipo": "salida", "cantidad": 5})
    assert r.status_code == 409 and "Stock insuficiente" in r.json()["detail"]
    assert admin.post("/api/movimientos", json={"materia_prima_id": choco["id"], "tipo": "entrada", "cantidad": 5}).status_code == 422

    # ya se consumió: la compra no se puede borrar
    assert admin.delete(f"/api/compras/{c1['id']}").status_code == 409

    admin.post("/api/movimientos", json={"materia_prima_id": choco["id"], "tipo": "ajuste", "cantidad": 9.5, "motivo": "conteo"})
    assert admin.get(f"/api/insumos/{choco['id']}").json()["stock_actual"] == 10.5
    assert admin.delete(f"/api/compras/{c1['id']}").status_code == 204
    assert admin.get(f"/api/insumos/{choco['id']}").json()["stock_actual"] == 0.5

    movs = admin.get("/api/movimientos", params={"materia_prima_id": choco["id"]}).json()
    assert [mv["tipo"] for mv in movs] == ["ajuste", "salida", "entrada"]

    d = admin.get("/api/dashboard", params={"desde": "2026-11-01", "hasta": "2026-11-30"}).json()
    assert d["gastos_materia_prima"] == 100
    assert [i["nombre"] for i in d["insumos_bajo_stock"]] == ["Chocolate"]
    # insumo con compras no se puede borrar
    assert admin.delete(f"/api/insumos/{choco['id']}").status_code == 409


def test_usuarios_permisos(admin, empleado):
    assert empleado.get("/api/usuarios").status_code == 403
    assert empleado.get("/api/productos").status_code == 200

    nuevo = admin.post("/api/usuarios", json={"nombre": "Caja", "email": "Caja@Test.com", "password": "clave1234"}).json()
    assert nuevo["email"] == "caja@test.com" and nuevo["rol"] == "empleado"
    assert admin.post("/api/usuarios", json={"nombre": "X", "email": "caja@test.com", "password": "clave1234"}).status_code == 409
    assert admin.post("/api/usuarios", json={"nombre": "X", "email": "x@test.com", "password": "corta"}).status_code == 422

    yo = admin.get("/api/auth/me").json()
    assert admin.patch(f"/api/usuarios/{yo['id']}", json={"rol": "empleado"}).status_code == 409
    assert admin.delete(f"/api/usuarios/{yo['id']}").status_code == 409


def test_chatbot_sin_ciclos(admin):
    a = admin.post("/api/chatbot", json={"etiqueta": "Precios", "respuesta": "..."}).json()
    b = admin.post("/api/chatbot", json={"etiqueta": "Envíos", "respuesta": "...", "padre_id": a["id"]}).json()
    assert admin.patch(f"/api/chatbot/{a['id']}", json={"padre_id": b["id"]}).status_code == 422
    assert admin.patch(f"/api/chatbot/{a['id']}", json={"padre_id": a["id"]}).status_code == 422


def test_negocio(admin):
    assert admin.get("/api/negocio").json() is None
    assert admin.put("/api/negocio", json={"whatsapp": "+593 99"}).status_code == 422
    r = admin.put("/api/negocio", json={"whatsapp": "593991234567", "horario": "9-18"}).json()
    assert r["whatsapp"] == "593991234567"
    assert TestClient(app).get("/api/publico/catalogo").json()["negocio"]["horario"] == "9-18"


def test_imagenes_subida_y_entrega(admin):
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    r = admin.post("/api/imagenes", files={"archivo": ("foto.png", png, "image/png")})
    assert r.status_code == 201
    url = r.json()["url"]
    assert url.startswith("/api/imagenes/")

    publico = TestClient(app)  # se ven sin login (las usa la página pública)
    g = publico.get(url)
    assert g.status_code == 200 and g.content == png and g.headers["content-type"] == "image/png"
    assert "immutable" in g.headers["cache-control"]

    # el tipo se valida por contenido, no por el nombre
    falso = admin.post("/api/imagenes", files={"archivo": ("x.jpg", b"<script>alert(1)</script>", "image/jpeg")})
    assert falso.status_code == 415
    grande = admin.post("/api/imagenes", files={"archivo": ("g.jpg", b"\xff\xd8\xff" + b"0" * (3 * 1024 * 1024), "image/jpeg")})
    assert grande.status_code == 413
    assert publico.post("/api/imagenes", files={"archivo": ("foto.png", png, "image/png")}).status_code == 401
    assert publico.get("/api/imagenes/" + "0" * 32).status_code == 404


def test_eventos_se_publican_con_origen(admin):
    from app.eventos import broker

    broker.historial.clear()
    p = admin.post("/api/productos", json={"nombre": "Torta", "precio": 10}, headers={"X-Cliente-Id": "pestana-1"}).json()
    admin.patch(f"/api/productos/{p['id']}", json={"precio": 12})
    pedido = admin.post("/api/pedidos", json={"cliente_nombre": "Ana", "cliente_telefono": "0991234567",
                                              "items": [{"descripcion": "Torta", "cantidad": 1, "precio_unitario": 12}]}).json()
    ins = admin.post("/api/insumos", json={"nombre": "Harina", "unidad": "kg"}).json()
    admin.post("/api/compras", json={"fecha": "2026-11-01", "items": [{"materia_prima_id": ins["id"], "cantidad": 2, "costo_unitario": 1}]})

    ev = list(broker.historial)
    assert ev[0] == {"canal": "productos", "accion": "crear", "id": p["id"], "origen": "pestana-1"}
    assert ev[1]["accion"] == "actualizar" and ev[1]["origen"] is None
    assert {"canal": "pedidos", "accion": "crear", "id": pedido["id"], "cliente": "Ana", "total": 12.0}.items() <= ev[2].items()
    assert [e["canal"] for e in ev[-2:]] == ["compras", "insumos"]


def test_canal_privado_exige_sesion():
    c = TestClient(app)
    assert c.get("/api/eventos", params={"token": "falso"}).status_code == 401
    assert c.get("/api/eventos").status_code == 422


def test_broker_filtra_canal_publico():
    import asyncio

    from app.eventos import Broker

    async def probar():
        b = Broker()
        b.iniciar(asyncio.get_running_loop())
        panel, publico = b.suscribir(False), b.suscribir(True)
        b.publicar("pedidos", "crear", 1)
        b.publicar("productos", "actualizar", 2)
        await asyncio.sleep(0)
        return [panel.cola.get_nowait() for _ in range(panel.cola.qsize())], [publico.cola.get_nowait() for _ in range(publico.cola.qsize())]

    panel, publico = asyncio.run(probar())
    assert [e["canal"] for e in panel] == ["pedidos", "productos"]
    assert publico == [{"canal": "catalogo"}]  # la web pública no recibe datos de pedidos
