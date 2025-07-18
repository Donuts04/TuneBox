"use client";
import Image from "next/image";

interface ArtworkItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const sampleArtwork: ArtworkItem[] = [
  {
    id: "1",
    title: "Sonic Waves",
    description: "A visual representation of sound waves in motion.",
    imageUrl: "/placeholder.svg?key=ix7wk",
  },
  {
    id: "2",
    title: "Vinyl Dreams",
    description: "An homage to the classic vinyl record.",
    imageUrl: "/placeholder.svg?key=5tpd5",
  },
  {
    id: "3",
    title: "Rhythm & Blues",
    description: "Capturing the soul and emotion of jazz music.",
    imageUrl: "/placeholder.svg?key=c5be0",
  },
  {
    id: "4",
    title: "Digital Symphony",
    description: "A digital exploration of classical music structures.",
    imageUrl: "/placeholder.svg?key=o2f3h",
  },
  {
    id: "5",
    title: "Beat Patterns",
    description: "Geometric patterns inspired by drum beats.",
    imageUrl: "/placeholder.svg?key=910ju",
  },
];

interface ArtworkGalleryProps {
  items?: ArtworkItem[];
  title?: string;
}

export default function ArtworkGallery({
  items = sampleArtwork,
  title = "Artwork Gallery",
}: ArtworkGalleryProps) {
  return (
    <section className="py-12">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold sm:text-4xl text-center mb-10">
          {title}
        </h2>

        {/* Grid layout with square items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden border border-black dark:border-white"
            >
              <Image
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Overlay with title and description that appears on hover */}
              <div className="absolute inset-0 bg-black/70 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="font-bold text-lg text-white">{item.title}</h3>
                <p className="text-sm text-white/80 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
