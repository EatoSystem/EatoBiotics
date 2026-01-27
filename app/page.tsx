import Image from "next/image"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white">
      {/* Background graphic - large and centered */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15">
        <Image
          src="/background-graphic.webp"
          alt=""
          width={800}
          height={800}
          className="w-full max-w-[500px] md:max-w-[600px] lg:max-w-[700px]"
          priority
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4 py-12 text-center sm:px-6 md:py-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50/80 px-4 py-2 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">Launching Soon</span>
        </div>

        <h1 className="bg-gradient-to-r from-green-600 via-emerald-500 to-amber-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-7xl lg:text-8xl">
          EatoBiotics
        </h1>

        <p className="mt-4 text-xl font-medium text-green-700 sm:mt-6 sm:text-2xl md:text-3xl">
          The Food System Inside You
        </p>

        <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-600 sm:mt-6 sm:max-w-xl sm:text-lg md:max-w-2xl md:text-xl">
          A practical guide to the foods that strengthen your microbiome and improve how you feel day to day — digestion, immunity, energy, mood, and recovery.
        </p>

        <p className="mt-4 max-w-md px-4 py-3 text-sm italic text-amber-700 sm:max-w-lg sm:text-base md:text-lg">
          "Build the food system inside you… and help build the food system around you."
        </p>

        {/* Call to action */}
        <div className="mt-8 flex w-full max-w-sm flex-col items-center justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:gap-4">
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            Subscribe on Substack
          </a>
          <a
            href="https://www.eatosystem.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full border-2 border-amber-500 bg-white/80 px-6 py-3.5 text-base font-semibold text-amber-600 backdrop-blur-sm transition-all duration-300 hover:bg-amber-500 hover:text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            Explore EatoSystem
          </a>
        </div>
      </div>

      {/* Bottom decorative bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-amber-500" />
    </main>
  )
}
