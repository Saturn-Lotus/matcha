import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';
import Image from 'next/image';

interface SuggestedProfileProps {
  className: string;
  imageSrc?: string;
  about: string;
  tags: string[];
}

function SuggestedProfile({ className, about, tags }: SuggestedProfileProps) {
  return (
    <Carousel className={`${className ?? ''} [&>div]:h-full`}>
      <CarouselContent className="h-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <Card className="relative h-full bg-white overflow-hidden p-0">
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 z-10">
                <Button
                  size="icon"
                  variant="secondary"
                  className="group h-15 w-15 rounded-full pointer-events-auto bg-gray-100 hover:bg-red-400"
                >
                  <X className="transition-transform duration-200 ease-in-out origin-center group-hover:rotate-90" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="group h-15 w-15 rounded-full bg-[#94b894] pointer-events-auto text-white hover:bg-[#7ba07b]"
                >
                  <Heart className="fill-current group-hover:scale-125 transition-all duration-200 ease-in-out" />
                </Button>
              </div>
              <CardContent className="h-full p-0 grid grid-rows-[60%_40%]">
                <Image alt="" className="w-full h-full object-cover" src="" />
                <div className="w-full flex flex-col h-full p-6 space-y-6">
                  <p>{about}</p>
                  <div className="flex justify-center flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

export default function Page() {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <div className="h-full w-[20%] bg-white"></div>
      <div className="h-full w-[80%] bg-pink-100 shadow-xl flex items-center justify-center">
        <SuggestedProfile
          className="w-[35%] h-[80%]"
          // imageSrc="/path/to/image.jpg"
          about="About this image"
          tags={['tag1', 'tag2']}
        />
      </div>
    </div>
  );
}
