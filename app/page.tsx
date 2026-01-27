import Image from "next/image"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white">
      {/* Background graphic - large and centered */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <Image
          src="/background-graphic.webp"
          alt=""
          width={800}
          height={800}
          className="w-[120%] max-w-none md:w-[80%] lg:w-[60%]"
          priority
        />
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 h-4 w-4 animate-pulse rounded-full bg-gradient-to-br from-lime-400 to-green-500 md:h-6 md:w-6" />
      <div className="absolute top-40 right-20 h-3 w-3 animate-pulse rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 md:h-5 md:w-5" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-32 left-20 h-5 w-5 animate-pulse rounded-full bg-gradient-to-br from-green-400 to-teal-500 md:h-7 md:w-7" style={{ animationDelay: "1s" }} />
      <div className="absolute right-16 bottom-40 h-4 w-4 animate-pulse rounded-full bg-gradient-to-br from-amber-400 to-orange-500 md:h-6 md:w-6" style={{ animationDelay: "1.5s" }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <h1 className="bg-gradient-to-r from-green-500 via-lime-500 to-amber-500 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent md:text-8xl lg:text-9xl">
          EatoBiotics
        </h1>
        <p className="mt-6 text-2xl font-medium text-green-600 md:mt-8 md:text-3xl lg:text-4xl">
          The Food System Inside You
        </p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
          A practical guide to the foods that strengthen your microbiome and improve how you feel day to day — digestion, immunity, energy, mood, and recovery.
        </p>
        <p className="mt-4 max-w-xl text-base italic text-amber-600 md:text-lg">
          "Build the food system inside you… and help build the food system around you."
        </p>

        {/* Call to action */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="https://eatobiotics.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gradient-to-r from-green-500 to-lime-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25"
          >
            Subscribe on Substack
          </a>
          <a
            href="https://www.eatosystem.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border-2 border-amber-500 px-8 py-4 text-lg font-semibold text-amber-600 transition-all duration-300 hover:bg-amber-500 hover:text-white"
          >
            Explore EatoSystem
          </a>
        </div>
      </div>

      {/* Bottom decorative bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-lime-400 to-amber-500" />
    </main>
  )
}
