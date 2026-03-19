import { User, Mail, Github, Code, Award, Target, Tv } from 'lucide-react'

function About() {

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('steadyliu85@gmail.com');
    alert('📧 邮箱 steadyliu85@gmail.com 已成功复制到剪贴板！');
  };

  return (
    <div className="pb-24 max-w-3xl mx-auto space-y-12 text-left">
      {/* 头部：头像与身份 */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-32 h-32 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full p-1 shadow-2xl shadow-blue-500/20">
          <div className="w-full h-full bg-white dark:bg-[#0a0a0c] rounded-full flex items-center justify-center border-4 border-white dark:border-[#0a0a0c] transition-colors">
            <User size={48} className="text-blue-500" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2 transition-colors">STEADY LIU</h1>
          <p className="text-blue-600 dark:text-blue-400 font-mono font-bold tracking-widest text-sm uppercase">
            Computer Science Undergraduate
          </p>
        </div>
      </div>

      {/* 个人简介 */}
      <div className="bg-white/80 dark:bg-gray-900/30 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-xl transition-colors duration-500">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4 transition-colors">
          <Code className="text-blue-500" size={20} /> ABOUT ME
        </h2>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed font-medium transition-colors">
          <p>
            计算机专业在读本科生。
          </p>
        </div>

        {/* 荣誉与动态 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4 tracking-widest uppercase">
              <Award className="text-blue-500" size={16} /> Milestones
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <li>待写</li>
              <li>待写</li>
              <li>待写</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4 tracking-widest uppercase">
              <Target className="text-blue-500" size={16} /> Focus & Goals
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <li>待写</li>
              <li>待写</li>
              <li>待写</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 链接 */}
      <div className="flex justify-center gap-6">
        {/* GitHub */}
        <a href="https://github.com/SteadyLiu85" target="_blank" rel="noreferrer" className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:border-blue-500/50 hover:-translate-y-1 transition-all shadow-sm">
          <Github size={24} />
        </a>
        
        <a href="https://space.bilibili.com/324338189" target="_blank" rel="noreferrer" className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:text-[#FB7299] hover:border-[#FB7299]/50 hover:-translate-y-1 transition-all shadow-sm">
          <Tv size={24} />
        </a>

        <button onClick={handleCopyEmail} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:border-blue-500/50 hover:-translate-y-1 transition-all shadow-sm cursor-pointer">
          <Mail size={24} />
        </button>
      </div>
    </div>
  )
}

export default About