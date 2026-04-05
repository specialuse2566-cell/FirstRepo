import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>Smart<span style={styles.accent}>Hire</span></h1>
        <div style={styles.navLinks}>
          <button style={styles.ghost} onClick={() => navigate('/login')}>Sign in</button>
          <button style={styles.primary} onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      <section style={styles.hero}>
        <div style={styles.tag}>AI-powered interview platform</div>
        <h1 style={styles.heroTitle}>Land the job you <em style={styles.em}>actually</em> want.</h1>
        <p style={styles.heroSub}>Practice with an AI interviewer, get instant feedback on your resume, and connect with companies that match your skills.</p>
        <div style={styles.heroActions}>
          <button style={styles.btnLarge} onClick={() => navigate('/register')}>Start practicing free</button>
          <button style={styles.btnOutline} onClick={() => navigate('/login')}>Sign in</button>
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}><span style={styles.statNum}>94%</span><span style={styles.statLabel}>Interview success rate</span></div>
          <div style={styles.stat}><span style={styles.statNum}>12k+</span><span style={styles.statLabel}>Candidates placed</span></div>
          <div style={styles.stat}><span style={styles.statNum}>800+</span><span style={styles.statLabel}>Hiring partners</span></div>
        </div>
      </section>

      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>Everything you need to interview with confidence.</h2>
        <div style={styles.grid}>
          {[
            { icon: '🎙', title: 'AI mock interviews', desc: 'Practice live with an AI that adapts questions to your role and experience.' },
            { icon: '📄', title: 'Resume intelligence', desc: 'Upload your resume and receive detailed skills analysis and ATS-optimized suggestions.' },
            { icon: '🔍', title: 'Smart job matching', desc: 'Our engine understands your skills and surfaces roles worth applying for.' },
            { icon: '📈', title: 'Progress tracking', desc: 'Track improvement session-by-session and watch your scores climb.' },
          ].map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={styles.icon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to change how you hire?</h2>
        <p style={styles.ctaSub}>Join thousands of candidates and recruiters who've made SmartHire the smarter way to interview.</p>
        <button style={styles.btnWhite} onClick={() => navigate('/register')}>Get started — it's free</button>
      </section>

      <footer style={styles.footer}>
        <span style={styles.logo}>Smart<span style={styles.accent}>Hire</span></span>
        <span style={styles.footerCopy}>© 2026 SmartHire</span>
      </footer>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#fafaf8' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', borderBottom: '1px solid #e2e1dd', position: 'sticky', top: 0, background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 },
  logo: { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1a1a1a' },
  accent: { color: '#2563eb' },
  navLinks: { display: 'flex', gap: '12px' },
  ghost: { padding: '9px 20px', border: '1px solid #e2e1dd', borderRadius: '8px', background: 'transparent', fontSize: '14px' },
  primary: { padding: '9px 22px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
  hero: { padding: '120px 60px 80px', maxWidth: '800px' },
  tag: { display: 'inline-block', padding: '6px 14px', background: '#eff4ff', border: '1px solid #bfdbfe', borderRadius: '100px', fontSize: '12px', fontWeight: '500', color: '#2563eb', marginBottom: '32px' },
  heroTitle: { fontFamily: 'Georgia, serif', fontSize: '72px', lineHeight: '1.05', letterSpacing: '-2px', color: '#1a1a1a', marginBottom: '28px' },
  em: { fontStyle: 'italic', color: '#2563eb' },
  heroSub: { fontSize: '18px', color: '#6b6b6b', maxWidth: '480px', marginBottom: '44px', lineHeight: '1.7' },
  heroActions: { display: 'flex', gap: '14px', marginBottom: '72px' },
  btnLarge: { padding: '14px 32px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '500' },
  btnOutline: { padding: '14px 32px', background: 'transparent', color: '#1a1a1a', border: '1.5px solid #e2e1dd', borderRadius: '10px', fontSize: '15px' },
  stats: { display: 'flex', gap: '48px', borderTop: '1px solid #e2e1dd', paddingTop: '40px' },
  stat: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statNum: { fontFamily: 'Georgia, serif', fontSize: '36px', color: '#1a1a1a', letterSpacing: '-1px' },
  statLabel: { fontSize: '13px', color: '#6b6b6b' },
  features: { padding: '100px 60px', borderTop: '1px solid #e2e1dd' },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: '48px', letterSpacing: '-1.5px', color: '#1a1a1a', marginBottom: '60px', maxWidth: '560px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', background: '#e2e1dd', border: '1px solid #e2e1dd', borderRadius: '16px', overflow: 'hidden' },
  featureCard: { background: '#fafaf8', padding: '44px 40px' },
  icon: { fontSize: '28px', marginBottom: '16px' },
  featureTitle: { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1a1a1a', marginBottom: '12px' },
  featureDesc: { fontSize: '15px', color: '#6b6b6b', lineHeight: '1.7' },
  cta: { margin: '0 60px 100px', padding: '80px', background: '#1a1a1a', borderRadius: '20px', textAlign: 'center' },
  ctaTitle: { fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff', letterSpacing: '-2px', marginBottom: '18px' },
  ctaSub: { fontSize: '17px', color: '#aaa', maxWidth: '420px', margin: '0 auto 40px', lineHeight: '1.7' },
  btnWhite: { padding: '14px 36px', background: '#fff', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '500' },
  footer: { padding: '40px 60px', borderTop: '1px solid #e2e1dd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  footerCopy: { fontSize: '12px', color: '#e2e1dd' },
};