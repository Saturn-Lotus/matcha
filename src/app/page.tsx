import { Button } from '@/app/components/ui/button';
import { ArrowRight, Check, Lock } from 'lucide-react';
import Link from 'next/link';

const ingredients = [
  {
    number: 'i.',
    title: 'Shared interests',
    body: 'Tags you both lean into - weighted by how rare they are, not how loud.',
  },
  {
    number: 'ii.',
    title: 'Proximity',
    body: 'Close enough for a Tuesday coffee. Far enough to still have a story.',
  },
  {
    number: 'iii.',
    title: 'Conversation tempo',
    body: 'How fast you reply, how long you write. We pair like rhythms.',
  },
  {
    number: 'iv.',
    title: 'Fame rating',
    body: "A reputation score from the people you've actually talked to.",
  },
  {
    number: 'v.',
    title: 'Orientation & identity',
    body: "What you're looking for, in your words. Honored before anything else.",
  },
  {
    number: 'vi.',
    title: 'Mutual curiosity',
    body: "One-way crushes don't make it to the top of the blend. Both sides have to lean in.",
  },
];

const privacyPoints = [
  ['No ad tracking', 'Zero third-party pixels, zero brokers.'],
  ['Photos stay yours', 'Watermarked and screenshot-flagged.'],
  ['One-tap delete', 'Everything, gone, in 30 seconds.'],
];

export default function Home() {
  return (
    <div className="flex-1 w-full">
      <section className="mx-auto w-full max-w-6xl px-5 pb-14 pt-10 sm:px-8 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-8 font-mono text-xs font-semibold uppercase tracking-widest text-gray-500">
              No. 01 - The house special
            </p>
            <h1 className="max-w-4xl text-7xl font-black leading-none tracking-tight text-gray-950 sm:text-8xl lg:text-9xl">
              Love,
              <span className="block pt-3 italic text-pink-500">
                brewed slow.
              </span>
              <span className="block pt-3 italic text-green-600">
                Served fresh.
              </span>
            </h1>
            <p className="mt-9 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              We pair people the way a good cafe pairs strawberry and matcha -
              on purpose, in proportion, and never by accident. No infinite
              swipe. No noise. Just the right blend.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/register">
                <Button className="h-14 rounded-full bg-gray-950 px-8 text-base font-bold text-white shadow-xl hover:bg-gray-800">
                  Start your journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="#matching"
                className="text-base font-semibold text-slate-600 underline decoration-slate-400 underline-offset-4 hover:text-slate-950"
              >
                See how matching works
              </Link>
            </div>
          </div>

          <div className="relative h-96 overflow-hidden lg:h-screen">
            <div className="absolute left-8 top-20 h-72 w-52 -rotate-3 rounded-3xl border border-pink-100 bg-pink-50/70 shadow-xl sm:h-80 sm:w-64">
              <div className="strawberry-hatch h-full rounded-3xl p-6">
                <p className="mt-28 font-mono text-xs font-bold tracking-wider text-pink-500">
                  [ portrait - candid ]
                </p>
              </div>
            </div>
            <div className="absolute left-1/3 top-10 z-10 h-80 w-60 rotate-1 rounded-3xl border border-amber-100 bg-cafe-paper/95 shadow-2xl sm:h-96 sm:w-72">
              <div className="stone-hatch h-full rounded-3xl p-6">
                <p className="mt-36 text-center font-mono text-xs font-bold tracking-wider text-stone-500">
                  [ couple - cafe weekend morning ]
                </p>
              </div>
            </div>
            <div className="absolute right-0 top-28 h-64 w-48 rotate-6 rounded-3xl border border-green-100 bg-green-50/80 shadow-xl sm:h-72 sm:w-60">
              <div className="matcha-hatch h-full rounded-3xl p-6">
                <p className="mt-28 font-mono text-xs font-bold tracking-wider text-green-600">
                  [ portrait - matcha ]
                </p>
              </div>
            </div>
            <div className="absolute bottom-6 right-4 z-20 flex h-36 w-36 -rotate-3 items-center justify-center rounded-full bg-green-500 text-center text-white shadow-2xl sm:h-44 sm:w-44">
              <div>
                <p className="text-4xl font-black sm:text-5xl">94%</p>
                <p className="mt-1 font-mono text-xs font-bold uppercase tracking-widest">
                  Average
                  <br />
                  blend match
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="matching"
        className="border-y border-slate-200/80 bg-white/20"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-16">
          <div>
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-widest text-pink-500">
              No. 02 - The recipe
            </p>
            <h2 className="max-w-md text-5xl font-black leading-none tracking-tight text-gray-950 sm:text-6xl">
              Six ingredients per match.
            </h2>
            <p className="mt-7 max-w-md text-lg leading-8 text-slate-600">
              We weigh a small, deliberate set of signals - and we tell you
              exactly which ones we used. No black box, no mystery algorithm
              pulling levers you cannot see.
            </p>
          </div>

          <div className="grid border-t border-slate-200 md:grid-cols-2 md:border-t-0">
            {ingredients.map((item) => (
              <article
                key={item.number}
                className="flex gap-4 border-b border-slate-200 py-6 md:px-7"
              >
                <span className="w-14 shrink-0 font-mono text-sm font-semibold text-slate-400">
                  {item.number}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-gray-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-slate-600">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid overflow-hidden rounded-3xl border border-slate-800 bg-white/20 lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="mb-6 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-gray-500">
              <Lock className="h-4 w-4" />
              No. 03 - Made without
            </p>
            <h2 className="max-w-xl text-5xl font-black leading-none tracking-tight text-gray-950 sm:text-6xl">
              Your dating life is{' '}
              <span className="italic text-pink-500">not a data set.</span>
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              We do not sell your photos. We do not train models on your
              messages. Your location rounds to the city before it leaves your
              phone. You can delete your account - and everything in it - from
              one button.
            </p>
          </div>

          <div className="border-t border-slate-800 bg-cafe-paper/70 p-8 sm:p-12 lg:border-l lg:border-t-0">
            <div className="grid gap-6">
              {privacyPoints.map(([title, body]) => (
                <div key={title} className="flex gap-4">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-green-500" />
                  <div>
                    <h3 className="font-mono text-sm font-black text-gray-950">
                      {title}
                    </h3>
                    <p className="mt-1 font-mono text-sm leading-6 text-slate-500">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
