import Image from "next/image"

export function BookCoverFamily() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]">
      <div className="relative w-full overflow-hidden rounded-xl shadow-xl">
        <Image
          src="/book-cover-family.png"
          alt="EatoBiotics: The Food System Inside Your Family by Jason Curry"
          width={600}
          height={800}
          className="w-full h-auto"
          priority
        />
      </div>
    </div>
  )
}
