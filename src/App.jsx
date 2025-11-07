import { useState, useEffect } from "react";
import {
  FaEye,
  FaBars,
  FaTimes,
  FaArrowLeft,
  FaUsers,
  FaBullseye,
  FaStar,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import Logo from "./assets/LOGO.png";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.VITE_API_REST;

const socket = io(SOCKET_URL, { transports: ["websocket"] });

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState("nosotros");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("Todos");
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [miValoracion, setMiValoracion] = useState(0);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [nombreComentario, setNombreComentario] = useState("");

  const especialidades = [
    "Todos",
    "Cardiólogo",
    "Gastroenterólogo",
    "Pediatra",
    "Dermatólogo",
    "Oftalmólogo",
    "Ginecólogo",
  ];

  const secciones = ["nosotros", "mision", "vision", "valores"];

  const iconosSecciones = {
    nosotros: <FaUsers />,
    mision: <FaBullseye />,
    vision: <FaEye />,
    valores: <FaStar />,
  };

  const infoSecciones = {
    nosotros: { titulo: "¿Quiénes somos?", texto: "Conectamos pacientes con médicos certificados, ofreciendo información clara y confiable." },
    mision: { titulo: "Misión", texto: "Brindar acceso fácil a atención médica profesional y de calidad." },
    vision: { titulo: "Visión", texto: "Ser la plataforma médica más confiable y accesible del país." },
    valores: { titulo: "Valores", texto: "Confianza · Ética · Empatía · Transparencia · Innovación" },
  };

  const cambiarSeccion = (sec) => {
    setSeccionActiva(sec);
    setMenuAbierto(false);
    if (infoSecciones[sec]) setNotificacion(infoSecciones[sec]);
    else setNotificacion(null);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/medicos`)
      .then((res) => res.json())
      .then((data) => {
        setMedicos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (medicoSeleccionado) {
      const guardada = localStorage.getItem(`valoracion-${medicoSeleccionado._id}`);
      setMiValoracion(guardada ? Number(guardada) : 0);
    }
  }, [medicoSeleccionado]);

  useEffect(() => {
    function alRecibirComentario({ medicoId, comentario }) {
      setMedicos((medicosAnteriores) =>
        medicosAnteriores.map((medico) => {
          if (medico._id === medicoId) {
            const yaExiste = medico.comentarios.find(c => c._id === comentario._id || c.userId === comentario.userId);
            const nuevosComentarios = yaExiste
              ? medico.comentarios.map(c => (c.userId === comentario.userId ? { ...c, ...comentario } : c))
              : [...medico.comentarios, comentario];
            return { ...medico, comentarios: nuevosComentarios };
          }
          return medico;
        })
      );
    }

    function alRecibirValoracion({ medicoId, promedio, valoracion }) {
      setMedicos((medicosAnteriores) =>
        medicosAnteriores.map((medico) => {
          if (medico._id === medicoId) {
            const yaExiste = medico.valoraciones.find(v => v.userId === valoracion.userId);
            const nuevasValoraciones = yaExiste
              ? medico.valoraciones.map(v => (v.userId === valoracion.userId ? { ...v, ...valoracion } : v))
              : [...medico.valoraciones, valoracion];
            return { ...medico, valoraciones: nuevasValoraciones, promedio };
          }
          return medico;
        })
      );
    }

    socket.on("nuevo_comentario", alRecibirComentario);
    socket.on("nueva_valoracion", alRecibirValoracion);

    return () => {
      socket.off("nuevo_comentario", alRecibirComentario);
      socket.off("nueva_valoracion", alRecibirValoracion);
    };
  }, []);

  const medicosFiltrados = medicos.filter(
    (m) => especialidadSeleccionada === "Todos" || m.especialidad === especialidadSeleccionada
  );

  const medicosDestacados = [...medicos].sort((a, b) => (b.promedio || 0) - (a.promedio || 0)).slice(0, 3);

  const generarUserId = () => {
    const id = "user-" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("userId", id);
    return id;
  };

  const valorarMedico = async (estrellas) => {
    setMiValoracion(estrellas);
    const userId = localStorage.getItem("userId") || generarUserId();
    try {
      await fetch(`${API_URL}/medicos/${medicoSeleccionado._id}/valorar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, estrellas }),
      });
      localStorage.setItem(`valoracion-${medicoSeleccionado._id}`, estrellas);
    } catch (err) { console.error(err); }
  };

  const colorAvatar = (nombre) => {
    const colors = ["#f87171","#fbbf24","#34d399","#60a5fa","#a78bfa","#f472b6","#fcd34d"];
    let hash = 0;
    if (!nombre) return colors[0];
    for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim() || !nombreComentario.trim()) return;
    const userId = localStorage.getItem("userId") || generarUserId();
    try {
      await fetch(`${API_URL}/medicos/${medicoSeleccionado._id}/comentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nombre: nombreComentario, texto: nuevoComentario }),
      });
      setNuevoComentario("");
      setNombreComentario("");
    } catch (err) { console.error(err); }
  };

  const medicoActualizado = medicoSeleccionado ? medicos.find((m) => m._id === medicoSeleccionado._id) : null;

  return (
    <div className="contenedor">
      <header className="navbar">
        <div className="logo-container">
          {!medicoSeleccionado ? (
            <div className="logo"><img src={Logo} alt="Clinic Center" /></div>
          ) : (
            <button className="btn-volver-header" onClick={() => setMedicoSeleccionado(null)}>
              <FaArrowLeft /> Volver
            </button>
          )}
        </div>

        {!medicoSeleccionado && (
          <div className="toggle-al-logo" onClick={() => { setMenuAbierto(!menuAbierto); if (notificacion) setNotificacion(null); }}>
            {menuAbierto ? <FaTimes /> : <FaBars />}
          </div>
        )}

        <nav className="menu-desktop">
          {secciones.map((sec) => (
            <button key={sec} className={seccionActiva === sec ? "activo" : ""} onClick={() => cambiarSeccion(sec)}>
              {sec.charAt(0).toUpperCase() + sec.slice(1)}
            </button>
          ))}
        </nav>

        <nav className={`menu-mobile ${menuAbierto ? "activo" : ""}`}>
          {secciones.map((sec) => (
            <button key={sec} className={seccionActiva === sec ? "activo" : ""} onClick={() => cambiarSeccion(sec)}>
              {iconosSecciones[sec]}<span>{sec.charAt(0).toUpperCase() + sec.slice(1)}</span>
            </button>
          ))}
        </nav>
      </header>

      {!medicoSeleccionado && (
        <motion.section className="hero" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <h1>Bienvenido a Clinic Center</h1>
          <p>Donde la atención profesional se combina con el cuidado humano.</p>
        </motion.section>
      )}

      <AnimatePresence>
        {notificacion && (
          <motion.div className="snackbar" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.4 }} style={{ zIndex: 2000 }}>
            <div className="snackbar-header">
              <h3>{notificacion.titulo}</h3>
              <button className="snackbar-close" onClick={() => setNotificacion(null)}>✕</button>
            </div>
            <p>{notificacion.texto}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="contenido">
        <section className="medicos">
          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><div className="loading-text">Cargando médicos...</div></div>
          ) : (
            <AnimatePresence mode="wait">
              {medicoSeleccionado && medicoActualizado ? (
                <motion.div key="perfil" className="perfil-medico" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                  <div className="card-perfil">
                    <div className="avatar-grande"><img src={medicoActualizado.imagen} alt={medicoActualizado.nombre} /></div>
                    <h2>{medicoActualizado.nombre}</h2>
                    <p className="especialidad">{medicoActualizado.especialidad}</p>
                    <p className="descripcion">{medicoActualizado.descripcion}</p>
                    <p><strong>Experiencia:</strong> {medicoActualizado.experiencia}</p>
                    <p><strong>Cédula:</strong> {medicoActualizado.cedula}</p>
                    <p><strong>Teléfono:</strong> {medicoActualizado.telefono}</p>
                    <div className="valoracion">
                      <p><strong>Valoración promedio:</strong></p>
                      <div className="estrellas">
                        {[1,2,3,4,5].map(n => <FaStar key={n} color={n <= (medicoActualizado?.promedio || 0) ? "#ffc107" : "#ccc"} />)}
                        <span>({(medicoActualizado?.promedio || 0).toFixed(1)})</span>
                      </div>
                      <p><strong>Tu valoración:</strong></p>
                      <div className="estrellas-interactivas">
                        {[1,2,3,4,5].map(n => <FaStar key={n} color={n <= miValoracion ? "#ffc107" : "#ccc"} onClick={() => valorarMedico(n)} style={{ cursor: "pointer" }} />)}
                      </div>
                    </div>
                    <div className="comentarios">
                      <h3>Comentarios</h3>
                      <ul>
                        {[...(medicoActualizado?.comentarios || [])].reverse().map((c,i) => (
                          <li key={c._id || i} className="comentario">
                            <div className="avatar-user" style={{ backgroundColor: colorAvatar(c.nombre) }}>{c.nombre ? c.nombre.charAt(0).toUpperCase() : "U"}</div>
                            <div className="contenido-comentario">
                              <strong>{c.nombre || "Usuario"}</strong>
                              <p>{c.texto}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="agregar-comentario">
                        <input type="text" placeholder="Tu nombre" value={nombreComentario} onChange={e => setNombreComentario(e.target.value)} />
                        <input type="text" placeholder="Escribe un comentario..." value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} />
                        <button onClick={enviarComentario}>Enviar</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {medicosDestacados.length > 0 && (
                    <section className="medicos-destacados">
                      <h2>Destacados</h2>
                      <div className="grid-medicos">
                        {medicosDestacados.map((m,i) => (
                          <motion.div key={m._id} className="card-medico" onClick={() => setMedicoSeleccionado(m)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i*0.05 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <div className="avatar"><img src={m.imagen} alt={m.nombre} /></div>
                            <h3>{m.nombre}</h3>
                            <p className="especialidad">{m.especialidad}</p>
                            <div className="estrellas">
                              {[1,2,3,4,5].map(n => <FaStar key={n} color={n <= (m.promedio || 0) ? "#ffc107" : "#ccc"} />)}
                              <span>({(m.promedio || 0).toFixed(1)})</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}
                  <motion.div key="lista" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                    <h2>Nuestros Médicos</h2>
                    {isMobile ? (
                      <select className="filtro-especialidades-mobile" value={especialidadSeleccionada} onChange={e => setEspecialidadSeleccionada(e.target.value)}>
                        {especialidades.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                      </select>
                    ) : (
                      <div className="filtro-especialidades">
                        {especialidades.map(esp => <button key={esp} className={esp === especialidadSeleccionada ? "activo" : ""} onClick={() => setEspecialidadSeleccionada(esp)}>{esp}</button>)}
                      </div>
                    )}
                    <div className="grid-medicos">
                      {medicosFiltrados.map((m,i) => (
                        <motion.div key={m._id} className="card-medico" onClick={() => setMedicoSeleccionado(m)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i*0.05 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                          <div className="avatar"><img src={m.imagen} alt={m.nombre} /></div>
                          <h3>{m.nombre}</h3>
                          <p className="especialidad">{m.especialidad}</p>
                          <p className="descripcion">{m.descripcion}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>

      <footer className="pie">
        <div className="footer-seccion">
          <h4>Contacto</h4>
          <p>Email: alexzav1818@gmail.com</p>
          <p>Tel: +52 3310178480</p>
          <div className="redes-sociales">
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
          </div>
          <small>&copy; 2025 Clinic Center — Todos los derechos reservados</small>
        </div>
      </footer>
    </div>
  );
}
