import CaseStudyHeader from '../components/CaseStudyHeader';

const TEAM_MEMBERS = [
  {
    index: '01',
    name: 'NOOL, JAMEELAH ZARRINA',
    roles: ['> UI/UX Designer', '> Frontend Developer'],
    focus: 'Visual architecture, interactive controls, and typographic system.',
  },
  {
    index: '02',
    name: 'PLAZA, JAMES CLAUDE',
    roles: ['> Python Backend', '> Algorithm Engineer'],
    focus: 'LIFO Stack & FIFO Queue state machines and boundary tracking.',
  },
  {
    index: '03',
    name: 'MAGTUBA, AIO',
    roles: ['> Python Backend', '> Algorithm Engineer'],
    focus: 'Binary Tree traversal logic, BST validation, and Frame-Stewart solver.',
  },
  {
    index: '04',
    name: 'PADAOANG, LOVELY',
    roles: ['> Frontend-Backend Integration', '> State Specialist'],
    focus: 'Deterministic animation playback, SVG tree coordinates, and QA.',
  },
];

export default function MembersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <CaseStudyHeader
        kicker="TEAM DIRECTORY • BEHIND THE SCENE"
        title="Project Team Members"
        description="Group contributors responsible for the design, algorithm development, backend logic, and frontend visual integration."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {TEAM_MEMBERS.map((member) => (
          <article
            key={member.name}
            className="bg-[#D9D9D9] border border-[#121212] flex flex-col justify-between"
          >
            <div>
              <div className="bg-[#1E2640] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#121212]">
                <span className="font-mono text-xs font-bold tracking-widest">
                  MEMBER #{member.index}
                </span>
                <span className="w-2.5 h-2.5 bg-[#D9531E]" aria-hidden="true" />
              </div>

              <div className="p-5">
                <h2 className="font-display text-lg leading-snug text-[#111111] tracking-tight">
                  {member.name}
                </h2>

                <div className="mt-4 pt-3 border-t border-[#9E9E9E] space-y-1.5">
                  {member.roles.map((role) => (
                    <p
                      key={role}
                      className="font-mono text-xs font-semibold text-[#111111]"
                    >
                      {role}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2">
              <p className="text-xs text-[#6B6B6B] leading-relaxed">{member.focus}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
