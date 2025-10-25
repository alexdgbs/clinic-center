// App.jsx
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
  FaLinkedinIn
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import Logo from "./assets/LOGO.png";

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

  const API_URL = import.meta.env.VITE_API_URL;

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
    nosotros: {
      titulo: "¿Quiénes somos?",
      texto: "Somos un centro médico enfocado en el cuidado integral de la salud, ofreciendo atención profesional y calidez humana.",
    },
    mision: {
      titulo: "Misión",
      texto: "Proporcionar servicios médicos de alta calidad, con un equipo comprometido con la salud y bienestar de cada paciente.",
    },
    vision: {
      titulo: "Visión",
      texto: "Ser una clínica referente en innovación, confianza y atención humana, contribuyendo al bienestar de la comunidad.",
    },
    valores: {
      titulo: "Valores",
      texto: "Empatía · Compromiso · Honestidad · Respeto · Profesionalismo",
    },
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
      .catch((err) => {
        console.error("Error al obtener médicos:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (medicoSeleccionado) {
      const guardada = localStorage.getItem(`valoracion-${medicoSeleccionado._id}`);
      setMiValoracion(guardada ? Number(guardada) : 0);
    }
  }, [medicoSeleccionado]);

  const medicosFiltrados = medicos.filter(
    (m) => especialidadSeleccionada === "Todos" || m.especialidad === especialidadSeleccionada
  );

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

      const resMedicos = await fetch(`${API_URL}/medicos`);
      const medicosActualizados = await resMedicos.json();
      setMedicos(medicosActualizados);

      localStorage.setItem(`valoracion-${medicoSeleccionado._id}`, estrellas);
    } catch (err) {
      console.error("Error al valorar médico:", err);
    }
  };

  return (
    <div className="contenedor">
      <header className="navbar">
        {/* Logo o botón de volver según estado */}
        <div className="logo-container">
          {!medicoSeleccionado ? (
            <div className="logo">
              <img src={Logo} alt="Clinic Center" />
            </div>
          ) : (
            <button className="btn-volver-header" onClick={() => setMedicoSeleccionado(null)}>
              <FaArrowLeft /> Volver
            </button>
          )}
        </div>

        {/* Toggle del menú solo si no estamos en perfil */}
        {!medicoSeleccionado && (
          <div
            className="toggle-al-logo"
            onClick={() => {
              setMenuAbierto(!menuAbierto);
              if (notificacion) setNotificacion(null);
            }}
          >
            {menuAbierto ? <FaTimes /> : <FaBars />}
          </div>
        )}

        <nav className="menu-desktop">
          {secciones.map((sec) => (
            <button
              key={sec}
              className={seccionActiva === sec ? "activo" : ""}
              onClick={() => cambiarSeccion(sec)}
            >
              {sec.charAt(0).toUpperCase() + sec.slice(1)}
            </button>
          ))}
        </nav>

        <nav className={`menu-mobile ${menuAbierto ? "activo" : ""}`}>
          {secciones.map((sec) => (
            <button
              key={sec}
              className={seccionActiva === sec ? "activo" : ""}
              onClick={() => cambiarSeccion(sec)}
            >
              {iconosSecciones[sec]}
              <span>{sec.charAt(0).toUpperCase() + sec.slice(1)}</span>
            </button>
          ))}
        </nav>
      </header>

      {!medicoSeleccionado && (
        <motion.section
          className="hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1>Bienvenido a Clinic Center</h1>
          <p>Donde la atención profesional se combina con el cuidado humano.</p>
        </motion.section>
      )}

      <AnimatePresence>
        {notificacion && (
          <motion.div
            className="snackbar"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            style={{ zIndex: 2000 }}
          >
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
            <div className="loading-overlay">
              <div className="spinner"></div>
              <div className="loading-text">Cargando médicos...</div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {medicoSeleccionado ? (
                <motion.div
                  key="perfil"
                  className="perfil-medico"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="card-perfil">
                    <div className="avatar-grande">
                      <img src={medicoSeleccionado.imagen} alt={medicoSeleccionado.nombre} />
                    </div>
                    <h2>{medicoSeleccionado.nombre}</h2>
                    <p className="especialidad">{medicoSeleccionado.especialidad}</p>
                    <p className="descripcion">{medicoSeleccionado.descripcion}</p>
                    <p><strong>Experiencia:</strong> {medicoSeleccionado.experiencia}</p>
                    <p><strong>Cédula:</strong> {medicoSeleccionado.cedula}</p>
                    <p><strong>Teléfono:</strong> {medicoSeleccionado.telefono}</p>
                    <div className="valoracion">
                      <p><strong>Valoración promedio:</strong></p>
                      <div className="estrellas">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <FaStar
                            key={n}
                            color={n <= (medicoSeleccionado.promedio || 0) ? "#ffc107" : "#ccc"}
                          />
                        ))}
                        <span>({(medicoSeleccionado.promedio || 0).toFixed(1)})</span>
                      </div>
                      <p><strong>Tu valoración:</strong></p>
                      <div className="estrellas-interactivas">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <FaStar
                            key={n}
                            color={n <= miValoracion ? "#ffc107" : "#ccc"}
                            onClick={() => valorarMedico(n)}
                            style={{ cursor: "pointer" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="lista"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2>Nuestros Médicos</h2>
                  {isMobile ? (
                    <select
                      className="filtro-especialidades-mobile"
                      value={especialidadSeleccionada}
                      onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
                    >
                      {especialidades.map((esp) => (
                        <option key={esp} value={esp}>{esp}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="filtro-especialidades">
                      {especialidades.map((esp) => (
                        <button
                          key={esp}
                          className={esp === especialidadSeleccionada ? "activo" : ""}
                          onClick={() => setEspecialidadSeleccionada(esp)}
                        >
                          {esp}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid-medicos">
                    {medicosFiltrados.map((m, i) => (
                      <motion.div
                        key={i}
                        className="card-medico"
                        onClick={() => setMedicoSeleccionado(m)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="avatar">
                          <img src={m.imagen} alt={m.nombre} />
                        </div>
                        <h3>{m.nombre}</h3>
                        <p className="especialidad">{m.especialidad}</p>
                        <p className="descripcion">{m.descripcion}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>

<footer className="pie">
  <div className="footer-seccion">
    <h4>Contacto</h4>
    <p>Email: contacto@cliniccenter.com</p>
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
