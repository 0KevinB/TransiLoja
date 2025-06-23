import { Construction, Bus, Clock, CreditCard, Map, Wifi, Users } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
      {/* Construction animation banner */}
      <div className="bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 animate-pulse">
        <Construction className="h-4 w-4" />
        <p className="text-sm font-medium">Sitio en construcción</p>
      </div>

      {/* Hero section */}
      <section className="container mx-auto px-4 pt-12 pb-24 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 opacity-75 blur-lg animate-pulse"></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-full p-4 shadow-xl">
            <Bus className="h-16 w-16 text-sky-500 dark:text-sky-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white mb-4">
          <span className="text-sky-500 dark:text-sky-400">Transi</span>Loja
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
          Transformando el transporte público en Loja, Ecuador
        </p>

        <div className="w-full max-w-md h-6 bg-slate-200 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full animate-progress"
            style={{ width: "35%" }}
          ></div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
          Estamos trabajando para brindarte la mejor experiencia de transporte urbano. ¡Pronto podrás acceder a toda la
          información de rutas, horarios y más!
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-6 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Suscríbete para actualizaciones
          </button>
          <Link
            href="https://github.com"
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium py-2 px-6 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-slate-200 dark:border-slate-600"
          >
            Contribuir al proyecto
          </Link>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-white dark:bg-slate-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-800 dark:text-white">
            Funcionalidades que estamos desarrollando
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Bus className="h-8 w-8" />,
                title: "Consulta de rutas",
                description: "Accede a todas las rutas de buses urbanos de Loja",
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Horarios precisos",
                description: "Consulta los horarios de salida y llegada de cada línea",
              },
              {
                icon: <CreditCard className="h-8 w-8" />,
                title: "Información de tarifas",
                description: "Conoce el costo de cada recorrido antes de viajar",
              },
              {
                icon: <Map className="h-8 w-8" />,
                title: "Mapas interactivos",
                description: "Visualiza las rutas en mapas interactivos de la ciudad",
              },
              {
                icon: <Wifi className="h-8 w-8" />,
                title: "Modo sin conexión",
                description: "Accede a información básica sin necesidad de internet",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Experiencia intuitiva",
                description: "Diseñada para todo tipo de usuarios, sin complicaciones",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-sky-50 dark:bg-slate-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-sky-100 dark:border-slate-600"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-sky-500 dark:text-sky-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies section */}
      <section className="py-16 bg-sky-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-800 dark:text-white">
            Tecnologías que utilizamos
          </h2>

          <div className="flex flex-wrap justify-center gap-6">
            {["React Native", "Next.js", "Firebase", "Figma", "Vercel"].map((tech, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 text-slate-800 dark:text-white font-medium border border-slate-200 dark:border-slate-700"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Moving bus animation */}
      <div className="relative h-24 overflow-hidden bg-sky-100 dark:bg-slate-800 border-t border-b border-sky-200 dark:border-slate-700">
        <div className="absolute inset-0 flex items-center">
          <div className="h-1 w-full bg-sky-300 dark:bg-slate-600"></div>
        </div>
        <div className="bus-animation">
          <Bus className="h-12 w-12 text-sky-500 dark:text-sky-400" />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                <span className="text-sky-400">Transi</span>Loja
              </h2>
              <p className="text-slate-400">Mejorando la movilidad urbana en Loja, Ecuador</p>
            </div>

            <div className="flex gap-6">
              <Link href="#" className="text-slate-300 hover:text-sky-400 transition-colors">
                Acerca de
              </Link>
              <Link href="#" className="text-slate-300 hover:text-sky-400 transition-colors">
                Contacto
              </Link>
              <Link href="#" className="text-slate-300 hover:text-sky-400 transition-colors">
                GitHub
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
            <p>© {new Date().getFullYear()} TransiLoja. Proyecto académico y comunitario.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
