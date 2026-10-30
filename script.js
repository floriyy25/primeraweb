(async () => {
    // =========================================================================
    // CREDENCIALES Y CONTROL DE SESIÓN
    // =========================================================================
    // =========================================================================
    // MODO OSCURO / CLARO
    // =========================================================================
    const btnToggleTheme = document.getElementById("btn-toggle-theme");
    const iconLight = document.querySelector(".theme-icon-light");
    const iconDark = document.querySelector(".theme-icon-dark");

    function aplicarIconoTema() {
        const tema = document.documentElement.getAttribute("data-bs-theme") || "light";
        if (iconLight && iconDark) {
            iconLight.classList.toggle("d-none", tema === "dark");
            iconDark.classList.toggle("d-none", tema !== "dark");
        }
    }

    aplicarIconoTema();

    btnToggleTheme?.addEventListener("click", () => {
        const actual = document.documentElement.getAttribute("data-bs-theme") || "light";
        const nuevo = actual === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-bs-theme", nuevo);
        localStorage.setItem("ci-theme", nuevo);
        aplicarIconoTema();
    });

    // =========================================================================
    // CREDENCIALES Y CONTROL DE SESIÓN (definidas primero para no depender de la BD)
    // =========================================================================
    const USUARIO_CORRECTO = "ituzaingo";
    const PASSWORD_CORRECTA = "12345";

    const pantallaLogin = document.getElementById("pantalla-login");
    const pantallaSistema = document.getElementById("pantalla-sistema");
    const formLogin = document.getElementById("form-login");
    const loginError = document.getElementById("login-error");
    const btnLogout = document.getElementById("btn-logout");

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
        cargarEmpleados();
    }

    // =========================================================================
    // SUPABASE CLIENT + EMPLEADOS (carga en segundo plano, sin bloquear el login)
    // =========================================================================
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    let supabase = null;
    try {
        if (supabaseUrl && supabaseKey) {
            supabase = (await import("@supabase/supabase-js")).createClient(supabaseUrl, supabaseKey);
        }
    } catch (e) {
        console.warn("No se pudo inicializar Supabase:", e);
    }

    let empleados = []; // [{ id, nombre, activo }]
    const selectVendedor = document.getElementById("select-vendedor");

    async function cargarEmpleados() {
        if (!supabase) return;
        const { data, error } = await supabase
            .from("empleados")
            .select("id, nombre, activo, created_at")
            .order("nombre", { ascending: true });
        if (error) {
            console.warn("Error cargando empleados:", error.message);
            return;
        }
        empleados = data || [];
        renderizarSelectVendedores();
        renderizarTablaEmpleados();
    }

    function renderizarSelectVendedores() {
        if (!selectVendedor) return;
        const activos = empleados.filter(e => e.activo);
        const valorActual = selectVendedor.value;
        selectVendedor.innerHTML = "";
        if (activos.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Sin empleados";
            opt.disabled = true;
            selectVendedor.appendChild(opt);
        } else {
            activos.forEach(e => {
                const opt = document.createElement("option");
                opt.value = e.nombre;
                opt.textContent = e.nombre;
                selectVendedor.appendChild(opt);
            });
            if (valorActual && activos.some(e => e.nombre === valorActual)) {
                selectVendedor.value = valorActual;
            }
        }
        renderizarSelectVendedoresVentas();
        renderizarSelectOperadorComanda();
    }

    function renderizarSelectOperadorComanda() {
        const selectOperador = document.getElementById("input-llave-operador");
        if (!selectOperador) return;

        const valorActual = selectOperador.value;
        selectOperador.innerHTML = `<option value="" selected disabled>Seleccionar vendedor</option>`;
        empleados.filter(e => e.activo).forEach(e => {
            const opt = document.createElement("option");
            opt.value = e.nombre;
            opt.textContent = e.nombre;
            selectOperador.appendChild(opt);
        });

        if (valorActual && empleados.some(e => e.activo && e.nombre === valorActual)) {
            selectOperador.value = valorActual;
        }
    }

    function renderizarSelectVendedoresVentas() {
        const selectVentas = document.getElementById("select-vendedor-ventas");
        if (!selectVentas) return;
        const valorActual = selectVentas.value || "todos";
        selectVentas.innerHTML = `<option value="todos">Todos</option>`;
        empleados.filter(e => e.activo).forEach(e => {
            const opt = document.createElement("option");
            opt.value = e.nombre;
            opt.textContent = e.nombre;
            selectVentas.appendChild(opt);
        });
        selectVentas.value = valorActual;
    }

    function renderizarTablaEmpleados() {
        const tbody = document.getElementById("tabla-empleados");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (empleados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted small">No hay empleados registrados.</td></tr>`;
            return;
        }
        empleados.forEach(e => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", e.id);
            tr.innerHTML = `
                <td class="fw-semibold">${e.nombre}</td>
                <td class="text-center">
                    <span class="badge ${e.activo ? 'bg-success' : 'bg-secondary'}">${e.activo ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-warning btn-toggle-emp" title="${e.activo ? 'Desactivar' : 'Activar'}">
                            <i class="bi ${e.activo ? 'bi-toggle-on' : 'bi-toggle-off'}"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-borrar-emp" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Agregar empleado
    document.getElementById("form-nuevo-empleado")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("input-nombre-empleado");
        const nombre = input.value.trim();
        if (!nombre || !supabase) return;
        const { error } = await supabase.from("empleados").insert({ nombre, activo: true });
        if (error) {
            alert("No se pudo agregar el empleado: " + error.message);
            return;
        }
        input.value = "";
        await cargarEmpleados();
    });

    // Activar/desactivar y eliminar empleado
    document.getElementById("tabla-empleados")?.addEventListener("click", async (e) => {
        const btnToggle = e.target.closest(".btn-toggle-emp");
        const btnBorrar = e.target.closest(".btn-borrar-emp");
        const tr = e.target.closest("tr[data-id]");
        if (!tr) return;
        const id = tr.getAttribute("data-id");
        if (!supabase) return;

        if (btnToggle) {
            const emp = empleados.find(x => x.id === id);
            if (!emp) return;
            const { error } = await supabase.from("empleados").update({ activo: !emp.activo }).eq("id", id);
            if (error) { alert("Error: " + error.message); return; }
            await cargarEmpleados();
        }

        if (btnBorrar) {
            const emp = empleados.find(x => x.id === id);
            if (!emp) return;
            if (!confirm(`¿Eliminar a "${emp.nombre}" del sistema?`)) return;
            const { error } = await supabase.from("empleados").delete().eq("id", id);
            if (error) { alert("Error: " + error.message); return; }
            await cargarEmpleados();
        }
    });

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
            { id: 1042, total: 12500, detalle: "Copia Llave Prive 2v (x2)", hora: "10:30", pago: "Efectivo" },
            { id: 1041, total: 26250, detalle: "Cerradura Kallay 4001 (x1)", hora: "09:15", pago: "Transferencia" }
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
        if (seccion === 'ventas') {
            renderizarHistorialVentas();
        }
    }

    // =========================================================================
    // COLORES POR TIPO Y MEDIO DE PAGO
    // =========================================================================
    const COLORES_TIPO = {
        "Venta Directa": "bg-primary",
        "Comanda Llave": "bg-info text-dark",
        "Servicio": "bg-warning text-dark"
    };

    const COLORES_PAGO = {
        "Efectivo": "bg-success",
        "Transferencia": "bg-primary",
        "Débito": "bg-info text-dark",
        "Cuenta Corriente": "bg-warning text-dark"
    };

    function badgeTipo(tipo) {
        const color = COLORES_TIPO[tipo] || "bg-secondary";
        return `<span class="badge ${color}">${tipo}</span>`;
    }

    function badgePago(pago) {
        const color = COLORES_PAGO[pago] || "bg-secondary";
        return `<span class="badge ${color}">${pago}</span>`;
    }

    function obtenerVentasDelDia() {
        const ventas = [];
        const claveHoy = formatearClaveFecha(fechaActual);

        (comandasPorFecha[claveHoy] || []).forEach(c => {
            ventas.push({
                id: c.id,
                tipo: "Venta Directa",
                vendedor: c.vendedor || "—",
                cliente: "Cliente General",
                pago: c.pago,
                total: c.total
            });
        });

        serviciosDomicilio.filter(s => s.estado === "Completado").forEach(s => {
            ventas.push({
                id: s.id,
                tipo: "Servicio",
                vendedor: s.operador || "—",
                cliente: s.cliente,
                pago: s.pago || "Efectivo",
                total: s.montoTotal || s.montoMO || 0
            });
        });

        return ventas;
    }

    function renderizarHistorialVentas() {
        const tbody = document.getElementById("tabla-ventas-productos-completa");
        if (!tbody) return;

        const selectVentas = document.getElementById("select-vendedor-ventas");
        const vendedorFiltro = selectVentas?.value || "todos";

        const ventas = obtenerVentasDelDia();
        const ventasFiltradas = vendedorFiltro === "todos"
            ? ventas
            : ventas.filter(v => v.vendedor === vendedorFiltro);

        if (ventasFiltradas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted small py-3">No hay ventas registradas${vendedorFiltro !== "todos" ? ` para ${vendedorFiltro}` : ""}.</td></tr>`;
        } else {
            tbody.innerHTML = "";
            ventasFiltradas.forEach(v => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>#${v.id}</td>
                    <td>${badgeTipo(v.tipo)}</td>
                    <td>${v.vendedor}</td>
                    <td>${v.cliente}</td>
                    <td>${badgePago(v.pago)}</td>
                    <td class="fw-bold text-success">${v.total.toLocaleString("es-AR")}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-secondary btn-ver-detalle-venta" data-id="${v.id}" data-tipo="${v.tipo}"><i class="bi bi-eye"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        const totalDia = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
        const badgeTotal = document.getElementById("badge-total-ventas-dia");
        if (badgeTotal) badgeTotal.textContent = `Total Día: ${totalDia.toLocaleString("es-AR")}`;

        renderizarResumenPagos(ventasFiltradas);
    }

    function renderizarResumenPagos(ventas) {
        const contenedor = document.getElementById("resumen-pagos-ventas");
        if (!contenedor) return;

        const desglose = {};
        ventas.forEach(v => {
            if (!desglose[v.pago]) desglose[v.pago] = 0;
            desglose[v.pago] += v.total;
        });

        const medios = Object.keys(COLORES_PAGO);
        const mediosPresentes = medios.filter(m => desglose[m] !== undefined);
        const otrosMedios = Object.keys(desglose).filter(m => !medios.includes(m));

        if (mediosPresentes.length === 0 && otrosMedios.length === 0) {
            contenedor.innerHTML = `<div class="col-12 text-center text-muted small py-2">No hay ventas para mostrar el resumen.</div>`;
            return;
        }

        let html = "";
        mediosPresentes.forEach(medio => {
            const color = COLORES_PAGO[medio] || "bg-secondary";
            html += `
                <div class="col-6 col-md-3">
                    <div class="border rounded p-2 h-100">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge ${color}">${medio}</span>
                        </div>
                        <div class="fs-5 fw-bold text-success">${desglose[medio].toLocaleString("es-AR")}</div>
                    </div>
                </div>
            `;
        });
        otrosMedios.forEach(medio => {
            html += `
                <div class="col-6 col-md-3">
                    <div class="border rounded p-2 h-100">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge bg-secondary">${medio}</span>
                        </div>
                        <div class="fs-5 fw-bold text-success">${desglose[medio].toLocaleString("es-AR")}</div>
                    </div>
                </div>
            `;
        });
        contenedor.innerHTML = html;
    }

    document.getElementById("select-vendedor-ventas")?.addEventListener("change", renderizarHistorialVentas);

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
                            <i class="bi bi-plus-square"></i> Stock
                        </button>
                        <button class="btn btn-outline-primary btn-editar-prod" title="Editar Producto">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-borrar-prod" title="Eliminar Producto">
                            <i class="bi bi-trash"></i>
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
                            <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-comanda border-0 px-1 py-0" title="Eliminar comanda"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                    <p class="mb-1 small text-muted">${c.detalle}</p>
                    <small class="text-secondary fs-7"><i class="bi bi-clock me-1"></i>${c.hora} — ${badgePago(c.pago)}</small>
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
                        ${p.stock <= 0 ? "Sin Stock" : '<i class="bi bi-plus-lg me-1"></i>Agregar'}
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
                <td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-item border-0" title="Quitar item"><i class="bi bi-trash"></i></button></td>
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

        const vendedor = selectVendedor?.value || "";
        if (!vendedor) return alert("Selecciona un vendedor antes de registrar la venta.");

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
            pago: opSel.value,
            vendedor: vendedor
        });

        cuerpoTabla.innerHTML = "";
        actualizarTotalComanda();
        renderizarCatalogo();
        actualizarVistaFecha();
        alert(`Venta registrada exitosamente por ${totalFinal.toLocaleString("es-AR")}.\nVendedor: ${vendedor}`);
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

        const mediosPagoConocidos = ["Efectivo", "Transferencia", "Débito", "Cuenta Corriente"];
        let desglose = {};
        mediosPagoConocidos.forEach(m => desglose[m] = 0);
        let totalIngresos = 0;

        (comandas || []).forEach(c => {
            if (desglose[c.pago] !== undefined) desglose[c.pago] += c.total;
            else desglose[c.pago] = (desglose[c.pago] || 0) + c.total;
            totalIngresos += c.total;
        });

        // Render ingresos por medio de pago
        if (contenedorIngresos) {
            contenedorIngresos.innerHTML = "";
            const mediosConMonto = Object.keys(desglose).filter(m => desglose[m] > 0);
            if (mediosConMonto.length === 0) {
                contenedorIngresos.innerHTML = `<li class="list-group-item text-muted small px-0 py-1">Sin ingresos hoy.</li>`;
            } else {
                mediosConMonto.forEach(medio => {
                    const li = document.createElement("li");
                    li.className = "list-group-item d-flex justify-content-between align-items-center px-0 py-1";
                    li.innerHTML = `<span class="small">${medio}</span><span class="badge bg-success-subtle text-success">$${desglose[medio].toLocaleString("es-AR")}</span>`;
                    contenedorIngresos.appendChild(li);
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
                    li.setAttribute("data-id-egreso", eg.id);
                    li.innerHTML = `
                        <span class="small">${eg.concepto}</span>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-danger-subtle text-danger">-$${eg.monto.toLocaleString("es-AR")}</span>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-egreso border-0 px-1 py-0" title="Eliminar egreso"><i class="bi bi-trash"></i></button>
                        </div>
                    `;
                    contenedorEgresos.appendChild(li);
                });
            }
        }

        if (montoIngresosEl) montoIngresosEl.textContent = `$${totalIngresos.toLocaleString("es-AR")}`;
        if (montoEgresosEl) montoEgresosEl.textContent = `$${totalEgresos.toLocaleString("es-AR")}`;
        if (totalEl) totalEl.textContent = `$${(totalIngresos - totalEgresos).toLocaleString("es-AR")}`;
    }

    // Eliminar egreso
    document.getElementById("lista-egresos-caja")?.addEventListener("click", (e) => {
        const btnEliminar = e.target.closest(".btn-eliminar-egreso");
        const li = e.target.closest("[data-id-egreso]");
        if (btnEliminar && li) {
            const id = parseInt(li.getAttribute("data-id-egreso"));
            if (confirm("¿Eliminar este egreso?")) {
                const clave = formatearClaveFecha(fechaActual);
                egresosPorFecha[clave] = egresosPorFecha[clave].filter(eg => eg.id !== id);
                actualizarVistaFecha();
            }
        }
    });

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
        renderizarCatalogoCompleto();
    });

    // EVENTOS PARA LAS ACCIONES DE CADA FILA DEL CATÁLOGO (STOCK, EDITAR Y BORRAR)
    document.getElementById("tabla-catalogo-completo")?.addEventListener("click", (e) => {
        const tr = e.target.closest("tr");
        if (!tr) return;

        const id = parseInt(tr.getAttribute("data-id"));
        const producto = catalogoProductos.find(p => p.id === id);
        if (!producto) return;

        // 1. Clic en "Stock"
        if (e.target.closest(".btn-stock-prod")) {
            document.getElementById("stock-prod-id").value = producto.id;
            document.getElementById("stock-prod-nombre").textContent = producto.nombre;
            document.getElementById("stock-prod-actual").textContent = `${producto.stock} un.`;
            document.getElementById("input-cantidad-stock").value = "";

            const modal = new bootstrap.Modal(document.getElementById("modalAjustarStock"));
            modal.show();
        }

        // 2. Clic en "Editar"
        if (e.target.closest(".btn-editar-prod")) {
            const editId = document.getElementById("edit-prod-id");
            const editCat = document.getElementById("edit-prod-categoria");
            const editNombre = document.getElementById("edit-prod-nombre");
            const editPrecio = document.getElementById("edit-prod-precio");
            const editStock = document.getElementById("edit-prod-stock");
            const editMinimo = document.getElementById("edit-prod-minimo");
            if (!editId) return;

            editId.value = producto.id;
            editCat.value = producto.categoria;
            editNombre.value = producto.detalle;
            editPrecio.value = producto.precio;
            editStock.value = producto.stock;
            editMinimo.value = producto.minStock;

            const modal = new bootstrap.Modal(document.getElementById("modalEditarProducto"));
            modal.show();
        }

        // 3. Clic en "Borrar"
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

    // SUBMIT EDITAR PRODUCTO
    document.getElementById("form-editar-producto")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById("edit-prod-id").value);
        const producto = catalogoProductos.find(p => p.id === id);
        if (!producto) return;

        const cat = document.getElementById("edit-prod-categoria").value;
        const nombre = document.getElementById("edit-prod-nombre").value.trim();
        producto.categoria = cat;
        producto.detalle = nombre;
        producto.nombre = `${cat} ${nombre}`;
        producto.precio = parseFloat(document.getElementById("edit-prod-precio").value);
        producto.stock = parseInt(document.getElementById("edit-prod-stock").value);
        producto.minStock = parseInt(document.getElementById("edit-prod-minimo").value);

        bootstrap.Modal.getInstance(document.getElementById("modalEditarProducto"))?.hide();
        renderizarCatalogoCompleto();
        renderizarCatalogo();
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

    if (sessionStorage.getItem("sesionIniciada") === "true") {
        mostrarSistema();
    }
})();
