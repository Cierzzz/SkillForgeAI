import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Guarded } from '../components/Protected.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { Alert, LoadingBlock, Stat } from '../components/ui.jsx';
import {
  IconLock,
  IconUser,
} from '../components/Icons.jsx';

const TYPES = [
  { value: 'shs_senior', label: 'Senior High School student' },
  { value: 'fresh_grad', label: 'Fresh college graduate' },
  { value: 'working_pro', label: 'Already working' },
  { value: 'other', label: 'Other' },
];

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.profile();
        setForm(data.profile ?? {});
        setSkills(data.skills ?? []);
        setStats(data.stats);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveProfile({
        fullName: form.full_name,
        userType: form.user_type,
        schoolName: form.school_name,
        gradeLevel: form.grade_level,
        currentProgram: form.current_program,
        major: form.major,
        graduationYear: form.graduation_year ? Number(form.graduation_year) : null,
        location: form.location,
        phone: form.phone,
        linkedinUrl: form.linkedin_url,
        portfolioUrl: form.portfolio_url,
        githubUrl: form.github_url,
        bio: form.bio,
        preferredRole: form.preferred_role,
        preferredTrack: form.preferred_track });
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwBusy(true);
    try {
      await api.changePassword(pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed. Other sessions were signed out.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="card">
        <LoadingBlock lines={6} />
      </div>
    );
  }

  return (
    <Guarded className="stack">
      <header>
        <h1 style={{ margin: '0.6rem 0 0.25rem' }}>Your profile</h1>
        <p style={{ marginBottom: 0 }}>Signed in as {user?.email} ({user?.role}).</p>
      </header>

      <div className="grid grid-4">
        <Stat value={stats?.recommendations ?? 0} label="Recommendations" />
        <Stat value={stats?.messages ?? 0} label="AI messages" />
        <Stat value={stats?.resumes ?? 0} label="Resumes" />
        <Stat value={skills.length} label="Skills on file" />
      </div>

      <form className="card stack" onSubmit={save}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 0 }}>Personal details</h2>

        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="fn">Full name</label>
            <input id="fn" className="input" value={form.full_name ?? ''} onChange={set('full_name')} maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="ut">I am a…</label>
            <select id="ut" className="select" value={form.user_type ?? 'shs_senior'} onChange={set('user_type')}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sn">School / company</label>
            <input id="sn" className="input" value={form.school_name ?? ''} onChange={set('school_name')} maxLength={160} />
          </div>
          <div className="field">
            <label htmlFor="gl">Grade level / position</label>
            <input id="gl" className="input" value={form.grade_level ?? ''} onChange={set('grade_level')} maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="cp">Current programme</label>
            <input id="cp" className="input" value={form.current_program ?? ''} onChange={set('current_program')} maxLength={160} />
          </div>
          <div className="field">
            <label htmlFor="gy">Graduation year</label>
            <input id="gy" className="input" type="number" min="1980" max="2100" value={form.graduation_year ?? ''} onChange={set('graduation_year')} />
          </div>
          <div className="field">
            <label htmlFor="loc">Location</label>
            <input id="loc" className="input" value={form.location ?? ''} onChange={set('location')} maxLength={160} />
          </div>
          <div className="field">
            <label htmlFor="ph">Contact number</label>
            <input id="ph" className="input" value={form.phone ?? ''} onChange={set('phone')} maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="li">LinkedIn</label>
            <input id="li" className="input" value={form.linkedin_url ?? ''} onChange={set('linkedin_url')} maxLength={300} />
          </div>
          <div className="field">
            <label htmlFor="gh">GitHub</label>
            <input id="gh" className="input" value={form.github_url ?? ''} onChange={set('github_url')} maxLength={300} />
          </div>
          <div className="field">
            <label htmlFor="pr">Preferred role</label>
            <input id="pr" className="input" value={form.preferred_role ?? ''} onChange={set('preferred_role')} maxLength={160} />
          </div>
          <div className="field">
            <label htmlFor="pt">Preferred track</label>
            <input id="pt" className="input" value={form.preferred_track ?? ''} onChange={set('preferred_track')} maxLength={120} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="bio">Short bio (used by the AI and your resume)</label>
          <textarea id="bio" className="textarea" maxLength={2000} value={form.bio ?? ''} onChange={set('bio')} />
          <span className="hint">{(form.bio ?? '').length}/2000</span>
        </div>

        <div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : null} Save profile
          </button>
        </div>
      </form>

      <form className="card stack" onSubmit={changePassword}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 0 }}>
          <IconLock size={18} /> Change password
        </h2>
        <Alert tone="info">Changing your password signs out every other device.</Alert>
        <div className="grid grid-2">
          <PasswordField
            id="cur-pw"
            label="Current password"
            value={pw.currentPassword}
            onChange={(v) => setPw((p) => ({ ...p, currentPassword: v }))}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-pw"
            label="New password"
            value={pw.newPassword}
            onChange={(v) => setPw((p) => ({ ...p, newPassword: v }))}
            autoComplete="new-password"
            showMeter
          />
        </div>
        <div>
          <button className="btn" type="submit" disabled={pwBusy || !pw.currentPassword || pw.newPassword.length < 10}>
            {pwBusy ? <span className="spinner" /> : null} Update password
          </button>
        </div>
      </form>
    </Guarded>
  );
}