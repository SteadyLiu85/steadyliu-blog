import { User, Mail, Github, Code, Award, Target, Tv } from 'lucide-react'

function About() {
  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('steadyliu85@gmail.com');
    alert('EMAIL COPIED: steadyliu85@gmail.com');
  };

  return (
    <div className="pb-24 max-w-3xl mx-auto space-y-16 text-left">
      <div className="flex flex-col items-center text-center space-y-8 mt-8">
        <div className="w-36 h-36 bg-theme-surface rounded-full flex items-center justify-center border-4 border-theme-border shadow-brutal-lg">
          <User size={64} strokeWidth={2.5} className="text-theme-accent" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-theme-text-primary tracking-tighter mb-4 uppercase">STEADY LIU</h1>
          <p className="bg-theme-border text-theme-surface font-mono font-black px-4 py-2 rounded-lg text-sm uppercase inline-block shadow-brutal-sm">
            Computer Science Undergraduate
          </p>
        </div>
      </div>

      <div className="bg-theme-surface p-10 md:p-16 rounded-3xl border-4 border-theme-border shadow-brutal-lg">
        <h2 className="text-3xl font-black text-theme-text-primary mb-8 flex items-center gap-4 border-b-4 border-theme-border pb-6 uppercase">
          <Code className="text-theme-accent" size={32} strokeWidth={3} /> ABOUT ME
        </h2>
        
        <div className="space-y-4 text-theme-text-primary text-xl font-bold leading-relaxed">
          <p>计算机专业在读本科生。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="bg-theme-base p-8 rounded-2xl border-4 border-theme-border shadow-brutal-sm">
            <h3 className="text-lg font-black text-theme-text-primary flex items-center gap-3 mb-6 uppercase">
              <Award className="text-theme-accent" size={24} strokeWidth={3} /> Milestones
            </h3>
            <ul className="space-y-3 text-theme-text-secondary font-bold text-lg list-disc list-inside marker:text-theme-accent">
              <li>待写</li>
              <li>待写</li>
              <li>待写</li>
            </ul>
          </div>
          
          <div className="bg-theme-base p-8 rounded-2xl border-4 border-theme-border shadow-brutal-sm">
            <h3 className="text-lg font-black text-theme-text-primary flex items-center gap-3 mb-6 uppercase">
              <Target className="text-theme-accent" size={24} strokeWidth={3} /> Focus & Goals
            </h3>
            <ul className="space-y-3 text-theme-text-secondary font-bold text-lg list-disc list-inside marker:text-theme-accent">
              <li>待写</li>
              <li>待写</li>
              <li>待写</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8">
        <a href="https://github.com/SteadyLiu85" target="_blank" rel="noreferrer" className="p-5 bg-theme-surface border-4 border-theme-border rounded-2xl text-theme-text-primary hover:text-white hover:bg-theme-border shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 active:active-brutal transition-all">
          <Github size={32} strokeWidth={2.5}/>
        </a>
        <a href="https://space.bilibili.com/324338189" target="_blank" rel="noreferrer" className="p-5 bg-theme-surface border-4 border-theme-border rounded-2xl text-theme-text-primary hover:text-white hover:bg-[#FB7299] hover:border-[#FB7299] shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 active:active-brutal transition-all">
          <Tv size={32} strokeWidth={2.5} />
        </a>
        <button onClick={handleCopyEmail} className="p-5 bg-theme-surface border-4 border-theme-border rounded-2xl text-theme-text-primary hover:text-white hover:bg-theme-accent hover:border-theme-accent shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 active:active-brutal transition-all cursor-pointer">
          <Mail size={32} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export default About