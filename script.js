document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // CREDANCIALES Y CONTROL DE SESIÓN
    // =========================================================================
    const USUARIO_CORRECTO = "ituzaingo";
    const PASSWORD_CORRECTA = "12345";

    const pantallaLogin = document.getElementById("pantalla-login");
    const pantallaSistema = document.getElementById("pantalla-sistema");
    const formLogin = document.getElementById("form-login");
    const loginError = document.getElementById("login-error");
    const btnLogout = document.getElementById("btn-logout");

    if (sessionStorage.getItem("sesionIniciada") === "true") {
        mostrarSistema();
    }

    formLogin?.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("login-usuario").value.trim();
        const pass = document.getElementById("login-password").value.trim();

        if (user === USUARIO_CORRECTO && pass === PASSWORD_CORRECTA) {
            sessionStorage.setItem("sesionIniciada", "true");
            loginError.classList.add("d-none");
            formLogin.reset();
            mostrarSistema();
        } else {
            loginError.classList.remove("d-none");
        }
    });

    btnLogout?.addEventListener("click", () => {
        sessionStorage.removeItem("sesionIniciada");
        pantallaSistema.classList.add("d-none");
        pantallaLogin.classList.remove("d-none");
    });

    function mostrarSistema() {
        pantallaLogin.classList.add("d-none");
        pantallaSistema.classList.remove("d-none");
        renderizarCatalogo();
        actualizarVistaFecha();
        navegarRuta();
    }

    // =========================================================================
    // ESTADO Y BASE DE DATOS LOCAL EN MEMORIA
    // =========================================================================
    let fechaActual = new Date(2026, 9, 7); // 07/10/2026

    const catalogoProductos = [
        { id: 101, nombre: "Cerradura Kallay 4001", categoria: "Cerradura", detalle: "Kallay 4001", precio: 25000, stock: 14, minStock: 3 },
        { id: 102, nombre: "Candado Securitas 50mm", categoria: "Candado", detalle: "Securitas 50mm", precio: 18500, stock: 1, minStock: 2 },
        { id: 103, nombre: "Copia Llave Prive 2v", categoria: "Llave", detalle: "Prive 2v", precio: 3500, stock: 50, minStock: 10 },
        { id: 104, nombre: "Cerrojo Kallay 1011", categoria: "Cerrojo", detalle: "Pasador Recto", precio: 21000, stock: 4, minStock: 2 }
    ];

    const serviciosDomicilio = [
        { id: 1, cliente: "Carlos Gómez", direccion: "Las Heras 450", telefono: "11 5544-3322", estado: "Pendiente" }
    ];

    const comandasPorFecha = {
        "2026-10-07": [
            { id: 1042, total: 12500, detalle: "Copia Llave Prive 2v (x2)", hora: "10:30 AM", pago: "Efectivo" },
            { id: 1041, total: 26250, detalle: "Cerradura Kallay 4001 (x1)", hora: "09:15 AM", pago: "MercadoPago" }
        ]
    };

    const egresosPorFecha = {
        "2026-10-07": [
            { id: 1, concepto: "Pago Proveedor Llaves", monto: 5000 },
            { id: 2, concepto: "Gastos Varios / Viáticos", monto: 1200 }
        ]
    };

    // Elementos DOM
    const kpiVentas = document.getElementById("kpi-ventas");
    const kpiServicios = document.getElementById("kpi-servicios");
    const kpiStock = document.getElementById("kpi-stock");
    const cuerpoTabla = document.getElementById("cuerpo-tabla");
    const totalComandaActualEl = document.getElementById("total-comanda-actual");
    const selectMedioPago = document.getElementById("select-medio-pago");
    const btnConfirmarVenta = document.getElementById("btn-confirmar-venta");
    const btnVaciarComanda = document.getElementById("btn-vaciar-comanda");

    const fechaDisplay = document.getElementById("fecha-display");
    const btnDiaAnterior = document.getElementById("btn-dia-anterior");
    const btnDiaSiguiente = document.getElementById("btn-dia-siguiente");
    const listaComandasEl = document.getElementById("lista-comandas");
    const totalComandasDiaBadge = document.getElementById("total-comandas-dia");

    // Eventos para filtros de categoría en POS
    document.querySelectorAll(".btn-filtro").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const categoria = e.target.getAttribute("data-categoria");
            renderizarCatalogo(categoria);
        });
    });

    // =========================================================================
    // ENRUTADOR Y RUTAS POR HASH (#/pos, #/cierre, #/productos/categoria)
    // =========================================================================
    function navegarRuta() {
        const hash = window.location.hash || '#/pos';
        const partes = hash.split('/');
        const seccion = partes[1] || 'pos';
        const parametro = partes[2] || null;

        document.querySelectorAll('.vista-seccion').forEach(sec => sec.style.display = 'none');
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

        const vistaActiva = document.getElementById(`vista-${seccion}`);
        const linkActivo = document.getElementById(`nav-${seccion}`);

        if (vistaActiva) vistaActiva.style.display = 'block';
        if (linkActivo) linkActivo.classList.add('active');

        if (seccion === 'productos') {
            renderizarCatalogoCompleto(parametro);
        }
    }

    window.addEventListener('hashchange', navegarRuta);

    function renderizarCatalogoCompleto(categoriaFiltro) {
        const tbody = document.getElementById("tabla-catalogo-completo");
        if (!tbody) return;

        tbody.innerHTML = "";
        const listaFiltrada = categoriaFiltro
            ? catalogoProductos.filter(p => p.categoria.toLowerCase() === categoriaFiltro.toLowerCase())
            : catalogoProductos;

        listaFiltrada.forEach(p => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", p.id);
            
            tr.innerHTML = `
                <td>#${p.id}</td>
                <td><span class="badge bg-secondary">${p.categoria}</span></td>
                <td class="fw-bold">${p.nombre}</td>
                <td><span class="badge ${p.stock <= p.minStock ? 'bg-danger' : 'bg-success'}">${p.stock} un.</span></td>
                <td class="fw-bold text-primary">$${p.precio.toLocaleString("es-AR")}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-success btn-stock-prod" title="Sumar / Descontar Stock">
                            ➕ Stock
                        </button>
                        <button class="btn btn-outline-primary btn-editar-prod" title="Editar Producto">
                            ✏️
                        </button>
                        <button class="btn btn-outline-danger btn-borrar-prod" title="Eliminar Producto">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================================================
    // NAVEGACIÓN Y CALENDARIO
    // =========================================================================
    btnDiaAnterior?.addEventListener("click", () => {
        fechaActual.setDate(fechaActual.getDate() - 1);
        actualizarVistaFecha();
    });

    btnDiaSiguiente?.addEventListener("click", () => {
        fechaActual.setDate(fechaActual.getDate() + 1);
        actualizarVistaFecha();
    });

    function formatearClaveFecha(fecha) {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, "0");
        const d = String(fecha.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function actualizarVistaFecha() {
        const opciones = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
        let textoFecha = fechaActual.toLocaleDateString('es-AR', opciones);
        textoFecha = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
        if (fechaDisplay) fechaDisplay.textContent = textoFecha;

        const clave = formatearClaveFecha(fechaActual);
        const comandasDelDia = comandasPorFecha[clave] || [];
        renderizarListaComandas(comandasDelDia);
        actualizarResumenCierreCaja(comandasDelDia);
    }

    function renderizarListaComandas(comandas) {
        if (!listaComandasEl) return;
        listaComandasEl.innerHTML = "";
        let sumaVentas = 0;

        if (comandas.length === 0) {
            listaComandasEl.innerHTML = `<div class="text-center text-muted my-4 py-3"><small>No hay comandas hoy.</small></div>`;
        } else {
            comandas.forEach(c => {
                sumaVentas += c.total;
                const item = document.createElement("div");
                item.className = "list-group-item p-3 rounded mb-2 border bg-white";
                item.setAttribute("data-id-comanda", c.id);
                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="mb-0 fw-bold">Comanda #${c.id}</h6>
                        <div class="d-flex align-items-center gap-1">
                            <span class="badge bg-success">$${c.total.toLocaleString("es-AR")}</span>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-comanda border-0 px-1 py-0">🗑️</button>
                        </div>
                    </div>
                    <p class="mb-1 small text-muted">${c.detalle}</p>
                    <small class="text-secondary fs-7">⏰ ${c.hora} — ${c.pago}</small>
                `;
                listaComandasEl.appendChild(item);
            });
        }

        if (totalComandasDiaBadge) totalComandasDiaBadge.textContent = `${comandas.length} Ventas`;
        if (kpiVentas) kpiVentas.textContent = `$${sumaVentas.toLocaleString("es-AR")}`;
    }

    listaComandasEl?.addEventListener("click", (e) => {
        const btnEliminar = e.target.closest(".btn-eliminar-comanda");
        const item = e.target.closest("[data-id-comanda]");
        if (btnEliminar && item) {
            const id = parseInt(item.getAttribute("data-id-comanda"));
            if (confirm(`¿Eliminar comanda #${id}?`)) {
                const clave = formatearClaveFecha(fechaActual);
                comandasPorFecha[clave] = comandasPorFecha[clave].filter(c => c.id !== id);
                actualizarVistaFecha();
            }
        }
    });

    // =========================================================================
    // CATALOGO Y VENTA POS
    // =========================================================================
    function renderizarCatalogo(categoriaFiltro = "Todas") {
        const tbody = document.getElementById("lista-tabla-productos");
        if (!tbody) return;

        tbody.innerHTML = "";
        let alertasCriticas = 0;

        const productosFiltrados = (categoriaFiltro === "Todas") 
            ? catalogoProductos 
            : catalogoProductos.filter(p => p.categoria.toLowerCase() === categoriaFiltro.toLowerCase());

        productosFiltrados.forEach(p => {
            const esCritico = p.stock <= p.minStock;
            if (esCritico) alertasCriticas++;

            const tr = document.createElement("tr");
            tr.className = `item-fila ${esCritico ? "table-danger" : ""}`;
            tr.setAttribute("data-id", p.id);
            tr.setAttribute("data-name", p.nombre);

            tr.innerHTML = `
                <td><strong>${p.categoria}</strong> ${p.nombre.replace(p.categoria, "")}</td>
                <td><span class="badge bg-secondary">${p.detalle}</span></td>
                <td><span class="badge ${esCritico ? "bg-danger" : "bg-success"}">${p.stock} un.</span></td>
                <td class="fw-bold text-primary">$${p.precio.toLocaleString("es-AR")}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-primary btn-add-pos" ${p.stock <= 0 ? "disabled" : ""}>
                        ${p.stock <= 0 ? "Sin Stock" : "➕ Agregar"}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (kpiStock) kpiStock.textContent = `${alertasCriticas} Críticos`;
        if (kpiServicios) kpiServicios.textContent = `${serviciosDomicilio.filter(s => s.estado === "Pendiente").length} Pendientes`;
    }

    document.addEventListener("click", (e) => {
        const btnAdd = e.target.closest(".btn-add-pos");
        if (!btnAdd) return;

        const fila = btnAdd.closest(".item-fila");
        const id = parseInt(fila.getAttribute("data-id"));
        const producto = catalogoProductos.find(p => p.id === id);

        if (producto) agregarOIncrementarItem(producto);
    });

    function agregarOIncrementarItem(producto) {
        let filaExistente = cuerpoTabla.querySelector(`tr[data-id="${producto.id}"]`);

        if (filaExistente) {
            const inputCantidad = filaExistente.querySelector(".input-cantidad");
            const nuevaCant = parseInt(inputCantidad.value) + 1;
            if (nuevaCant <= producto.stock) {
                inputCantidad.value = nuevaCant;
            } else {
                alert(`Límite de stock alcanzado (${producto.stock} disponibles).`);
            }
        } else {
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", producto.id);
            tr.setAttribute("data-precio", producto.precio);

            tr.innerHTML = `
                <td>#${producto.id}</td>
                <td><strong>${producto.categoria}</strong></td>
                <td>${producto.detalle}</td>
                <td><input type="number" class="form-control form-control-sm input-cantidad" value="1" min="1" max="${producto.stock}" style="width: 70px;"></td>
                <td class="precio-unitario">$${producto.precio.toLocaleString("es-AR")}</td>
                <td class="fw-bold precio-subtotal">$${producto.precio.toLocaleString("es-AR")}</td>
                <td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-item" title="Quitar item">🗑️</button></td>
            `;

            cuerpoTabla.appendChild(tr);

            tr.querySelector(".input-cantidad").addEventListener("input", (e) => {
                let v = parseInt(e.target.value);
                if (v > producto.stock) e.target.value = producto.stock;
                if (v < 1 || isNaN(v)) e.target.value = 1;
                actualizarTotalComanda();
            });

            tr.querySelector(".btn-eliminar-item").addEventListener("click", () => {
                tr.remove();
                actualizarTotalComanda();
            });
        }
        actualizarTotalComanda();
    }

    // Vaciar toda la comanda
    btnVaciarComanda?.addEventListener("click", () => {
        if (cuerpoTabla.children.length === 0) return;
        if (confirm("¿Deseas vaciar la comanda actual?")) {
            cuerpoTabla.innerHTML = "";
            actualizarTotalComanda();
        }
    });

    selectMedioPago?.addEventListener("change", actualizarTotalComanda);

    function actualizarTotalComanda() {
        let subtotalAcumulado = 0;
        cuerpoTabla.querySelectorAll("tr").forEach(tr => {
            const precio = parseFloat(tr.getAttribute("data-precio"));
            const cant = parseInt(tr.querySelector(".input-cantidad").value) || 1;
            const sub = precio * cant;
            tr.querySelector(".precio-subtotal").textContent = `$${sub.toLocaleString("es-AR")}`;
            subtotalAcumulado += sub;
        });

        const opSel = selectMedioPago.options[selectMedioPago.selectedIndex];
        const recargoPct = parseFloat(opSel?.getAttribute("data-recargo") || "0");
        const totalConRecargo = subtotalAcumulado * (1 + recargoPct / 100);

        if (totalComandaActualEl) {
            totalComandaActualEl.textContent = `$${Math.round(totalConRecargo).toLocaleString("es-AR")}`;
        }
    }

    btnConfirmarVenta?.addEventListener("click", () => {
        const filas = cuerpoTabla.querySelectorAll("tr");
        if (filas.length === 0) return alert("Agrega productos antes de cobrar.");

        let resumenItems = [];
        let subtotal = 0;

        filas.forEach(tr => {
            const id = parseInt(tr.getAttribute("data-id"));
            const cant = parseInt(tr.querySelector(".input-cantidad").value);
            const producto = catalogoProductos.find(p => p.id === id);

            if (producto) {
                producto.stock -= cant;
                resumenItems.push(`${producto.nombre} (x${cant})`);
                subtotal += producto.precio * cant;
            }
        });

        const opSel = selectMedioPago.options[selectMedioPago.selectedIndex];
        const recargoPct = parseFloat(opSel.getAttribute("data-recargo") || "0");
        const totalFinal = Math.round(subtotal * (1 + recargoPct / 100));

        const clave = formatearClaveFecha(fechaActual);
        if (!comandasPorFecha[clave]) comandasPorFecha[clave] = [];

        comandasPorFecha[clave].unshift({
            id: Math.floor(1000 + Math.random() * 9000),
            total: totalFinal,
            detalle: resumenItems.join(", "),
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pago: opSel.value
        });

        cuerpoTabla.innerHTML = "";
        actualizarTotalComanda();
        renderizarCatalogo();
        actualizarVistaFecha();
        alert(`Venta registrada exitosamente por $${totalFinal.toLocaleString("es-AR")}.`);
    });

    // =========================================================================
    // RESUMEN / CIERRE DE CAJA
    // =========================================================================
    function actualizarResumenCierreCaja(comandas) {
        const contenedorIngresos = document.getElementById("lista-cierre-caja");
        const contenedorEgresos = document.getElementById("lista-egresos-caja");
        const fechaEl = document.getElementById("fecha-cierre-caja");
        const montoIngresosEl = document.getElementById("monto-ingresos");
        const montoEgresosEl = document.getElementById("monto-egresos");
        const totalEl = document.getElementById("monto-total-cierre");

        if (fechaEl) {
            const opciones = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
            let textoFecha = fechaActual.toLocaleDateString('es-AR', opciones);
            fechaEl.textContent = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
        }

        let desglose = { "Efectivo": 0, "MercadoPago": 0, "Tarjeta de Débito": 0, "Tarjeta de Crédito": 0, "Cuenta Corriente": 0 };
        let totalIngresos = 0;

        (comandas || []).forEach(c => {
            if (desglose[c.pago] !== undefined) desglose[c.pago] += c.total;
            else desglose[c.pago] = c.total;
            totalIngresos += c.total;
        });

if (contenedorEgresos) {
            contenedorEgresos.innerHTML = "";
            if (egresosDelDia.length === 0) {
                contenedorEgresos.innerHTML = `<li class="list-group-item text-muted small px-0 py-1">Sin egresos hoy.</li>`;
            } else {
                egresosDelDia.forEach(eg => {
                    totalEgresos += eg.monto;
                    const li = document.createElement("li");
                    li.className = "list-group-item d-flex justify-content-between align-items-center px-0 py-1";
                    li.setAttribute("data-id-egreso", eg.id);
                    li.innerHTML = `
                        <span>${eg.concepto}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-danger-subtle text-danger">-$${eg.monto.toLocaleString("es-AR")}</span>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-egreso border-0 px-1 py-0" title="Eliminar egreso">🗑️</button>
                        </div>
                    `;
                    contenedorEgresos.appendChild(li);
                });
            }
        }

        const claveFecha = formatearClaveFecha(fechaActual);
        const egresosDelDia = egresosPorFecha[claveFecha] || [];
        let totalEgresos = 0;

        if (contenedorEgresos) {
            contenedorEgresos.innerHTML = "";
            if (egresosDelDia.length === 0) {
                contenedorEgresos.innerHTML = `<li class="list-group-item text-muted small px-0 py-1">Sin egresos hoy.</li>`;
            } else {
                egresosDelDia.forEach(eg => {
                    totalEgresos += eg.monto;
                    const li = document.createElement("li");
                    li.className = "list-group-item d-flex justify-content-between align-items-center px-0 py-1";
                    li.innerHTML = `<span>${eg.concepto}</span><span class="badge bg-danger-subtle text-danger">-$${eg.monto.toLocaleString("es-AR")}</span>`;
                    contenedorEgresos.appendChild(li);
                });
            }
        }

        if (montoIngresosEl) montoIngresosEl.textContent = `$${totalIngresos.toLocaleString("es-AR")}`;
        if (montoEgresosEl) montoEgresosEl.textContent = `$${totalEgresos.toLocaleString("es-AR")}`;
        if (totalEl) totalEl.textContent = `$${(totalIngresos - totalEgresos).toLocaleString("es-AR")}`;
    }

    // Formularios de modales
    document.getElementById("form-nuevo-egreso")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const concepto = document.getElementById("input-egreso-concepto").value;
        const monto = parseFloat(document.getElementById("input-egreso-monto").value);

        const clave = formatearClaveFecha(fechaActual);
        if (!egresosPorFecha[clave]) egresosPorFecha[clave] = [];

        egresosPorFecha[clave].unshift({
            id: Date.now(),
            concepto: concepto,
            monto: monto
        });

        e.target.reset();
        bootstrap.Modal.getInstance(document.getElementById("modalNuevoEgreso")).hide();
        actualizarVistaFecha();
    });

    document.getElementById("form-nueva-venta")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const desc = document.getElementById("input-descripcion").value;
        const monto = parseFloat(document.getElementById("input-monto").value);
        const pago = document.getElementById("input-pago").value;

        const clave = formatearClaveFecha(fechaActual);
        if (!comandasPorFecha[clave]) comandasPorFecha[clave] = [];

        comandasPorFecha[clave].unshift({
            id: Math.floor(1000 + Math.random() * 9000),
            total: monto,
            detalle: desc,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pago: pago
        });

        e.target.reset();
        bootstrap.Modal.getInstance(document.getElementById("modalNuevaVenta")).hide();
        actualizarVistaFecha();
    });

    document.getElementById("form-nuevo-producto")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("prod-nombre").value;
        const cat = document.getElementById("prod-categoria").value;
        const precio = parseFloat(document.getElementById("prod-precio").value);
        const stock = parseInt(document.getElementById("prod-stock").value);
        const min = parseInt(document.getElementById("prod-minimo").value);

        catalogoProductos.push({
            id: Math.floor(100 + Math.random() * 900),
            nombre: `${cat} ${nombre}`,
            categoria: cat,
            detalle: nombre,
            precio: precio,
            stock: stock,
            minStock: min
        });

        e.target.reset();
        bootstrap.Modal.getInstance(document.getElementById("modalNuevoProducto")).hide();
        renderizarCatalogo();
    });

    // EVENTOS PARA LAS ACCIONES DE CADA FILA DEL CATÁLOGO (STOCK, EDITAR Y BORRAR)
    document.getElementById("tabla-catalogo-completo")?.addEventListener("click", (e) => {
        const tr = e.target.closest("tr");
        if (!tr) return;
        
        const id = parseInt(tr.getAttribute("data-id"));
        const producto = catalogoProductos.find(p => p.id === id);
        if (!producto) return;

        // 1. Clic en "➕ Stock"
        if (e.target.closest(".btn-stock-prod")) {
            document.getElementById("stock-prod-id").value = producto.id;
            document.getElementById("stock-prod-nombre").textContent = producto.nombre;
            document.getElementById("stock-prod-actual").textContent = `${producto.stock} un.`;
            document.getElementById("input-cantidad-stock").value = "";
            
            const modal = new bootstrap.Modal(document.getElementById("modalAjustarStock"));
            modal.show();
        }

        // 2. Clic en "✏️ Editar"
        if (e.target.closest(".btn-editar-prod")) {
            const nuevoNombre = prompt("Editar nombre del producto:", producto.nombre);
            if (nuevoNombre !== null && nuevoNombre.trim() !== "") {
                producto.nombre = nuevoNombre.trim();
            }
            
            const nuevoPrecio = prompt("Editar precio ($):", producto.precio);
            if (nuevoPrecio !== null && !isNaN(parseFloat(nuevoPrecio))) {
                producto.precio = parseFloat(nuevoPrecio);
            }

            renderizarCatalogoCompleto();
            renderizarCatalogo();
        }

        // 3. Clic en "🗑️ Borrar"
        if (e.target.closest(".btn-borrar-prod")) {
            if (confirm(`¿Seguro que deseas eliminar "${producto.nombre}" del sistema?`)) {
                const index = catalogoProductos.findIndex(p => p.id === id);
                if (index !== -1) {
                    catalogoProductos.splice(index, 1);
                    renderizarCatalogoCompleto();
                    renderizarCatalogo();
                }
            }
        }
    });

    // SUBMIT DEL FORMULARIO DE AJUSTE DE STOCK
    document.getElementById("form-ajustar-stock")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById("stock-prod-id").value);
        const cantidadAjuste = parseInt(document.getElementById("input-cantidad-stock").value);

        const producto = catalogoProductos.find(p => p.id === id);
        if (producto && !isNaN(cantidadAjuste)) {
            producto.stock += cantidadAjuste;
            if (producto.stock < 0) producto.stock = 0;

            renderizarCatalogoCompleto();
            renderizarCatalogo();

            const modalEl = document.getElementById("modalAjustarStock");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }
    });
});