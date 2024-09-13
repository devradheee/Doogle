import Link from 'next/link'

export default function Attraction() {
  return (
    <section className="relative w-screen py-12 bg-black text-white">
      <div className="mx-auto max-w-screen-2xl px-8 md:px-16 py-2">
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[150px] w-4/5 md:h-[400px] rounded-[100%] bg-purple-500 blur-[90px] pointer-events-none opacity-10"></div>
        <div class="mt-8 grid gap-2 md:mt-16 lg:grid-cols-4 ">
          <div className=" relative flex flex-col  p-6 md:p-8 cursor-default bg-purple-400 bg-opacity-10 backdrop-blur transition rounded-xl lg:rounded-tl-[3rem] lg:rounded-bl-[3rem] hover:scale-[1.02] hover:bg-purple-600  hover:bg-opacity-10">
            <h3 className="flex  gap-1 text-zinc-50 font-display text-xl font-medium leading-none md:text-2xl ">
              <span>Make Streak</span>
            </h3>
            <p className="text-base mt-2 grow opacity-60 xl:mx-4 ">
            🚀 Start a daily coding streak and track your progress
            </p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            🔥 Stay motivated by reaching new milestones every day.
            </p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            🌟 Earn Doogcoins and rewards for consistent engagement
            </p>
            
          </div>
          <div className=" relative flex flex-col  p-6 md:p-8 cursor-default bg-white/10 backdrop-blur transition rounded-xl  hover:scale-[1.02] hover:bg-white/10">
            <h3 className="flex  gap-1 text-zinc-50 font-display text-xl font-medium leading-none md:text-2xl">
              <span>Share your knowledge</span>
            </h3>

            <p className="text-base mt-2 grow opacity-60 xl:mx-4 ">
            🌐 Showcase your skills and interests on a customizable profile
            </p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            🤝 Connect with developers who share similar passions
            </p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            📈 Enhance your visibility within the community.
            </p>
          
          </div>
          <div className=" relative flex flex-col  p-6 md:p-8 cursor-default bg-white/5 backdrop-blur transition rounded-xl  hover:scale-[1.02] hover:bg-white/10">
            <h3 className="flex  gap-1 text-zinc-50 font-display text-xl font-medium leading-none md:text-2xl">
              <span>Get your doubts solved</span>
            </h3>

            <p className="text-base mt-2 grow opacity-60 xl:mx-4 ">
            ❓Ask coding queries, challenges, or project-related questions
            </p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            🤔 Receive timely assistance from a diverse community of developers
            </p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            ✅ Approve solutions and earn credits for helpful engagements
            </p>
            
          </div>
          <div className=" relative flex flex-col  p-6 md:p-8 cursor-default bg-white/5 backdrop-blur transition rounded-xl lg:rounded-tr-[3rem] lg:rounded-br-[3rem] hover:scale-[1.02] hover:bg-white/10">
            <h3 className="flex  gap-1 text-zinc-50 font-display text-xl font-medium leading-none md:text-2xl">
              <span>Level Up</span>
            </h3>
            <p className="text-base mt-2 grow opacity-60 xl:mx-4 ">
            📊 Level up by actively participating and contributing</p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">🏆 Earn as you progress</p>
            <p className="text-base mt-1 grow opacity-60 xl:mx-4 ">
            🤖 Engage in discussions, challenges, and collaborative projects
            </p>

          </div>
        </div>
      </div>
    </section>
  );
}
