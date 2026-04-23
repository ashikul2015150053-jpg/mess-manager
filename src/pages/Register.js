import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    guardian_phone: '',
    university: '',
    room_preference: '',
    seat_type: 'shared',
    move_in_date: '',
  });

  const [files, setFiles] = useState({
    photo: null,
    nid_front: null,
    nid_back: null,
  });

  const [previews, setPreviews] = useState({
    photo: null,
    nid_front: null,
    nid_back: null,
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFile(e, key) {
    const file = e.target.files[0];
    if (!file) return;
    setFiles({ ...files, [key]: file });
    setPreviews({ ...previews, [key]: URL.createObjectURL(file) });
  }

  async function uploadFile(file, path) {
    const { data, error } = await supabase.storage
      .from('registrations')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('registrations')
      .getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.phone.trim()) return setError('Phone number is required.');
    if (!files.photo) return setError('Please upload your photo.');
    if (!files.nid_front) return setError('Please upload NID front side.');
    if (!files.nid_back) return setError('Please upload NID back side.');

    setLoading(true);
    try {
      const ts = Date.now();

      // Upload all 3 files
      const [photoUrl, nidFrontUrl, nidBackUrl] = await Promise.all([
        uploadFile(files.photo, `${ts}_photo_${files.photo.name}`),
        uploadFile(files.nid_front, `${ts}_nid_front_${files.nid_front.name}`),
        uploadFile(files.nid_back, `${ts}_nid_back_${files.nid_back.name}`),
      ]);

      // Save registration
      const { error: dbError } = await supabase
        .from('student_registrations')
        .insert([{
          ...form,
          photo_url: photoUrl,
          nid_front_url: nidFrontUrl,
          nid_back_url: nidBackUrl,
          status: 'pending',
        }]);

      if (dbError) throw dbError;

      setStep(2);
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 2) {
    return (
      <div className="register-page">
        <div className="register-card">
          <div className="register-success">
            <div className="success-icon">✅</div>
            <h2>Registration Submitted!</h2>
            <p>Your application has been received. The admin will review your documents and contact you.</p>
            <p className="success-note">Once approved, you'll receive your <strong>MESS ID</strong> which you can use to log in.</p>
            <button className="btn btn-primary" onClick={() => { setStep(1); setForm({ name: '', phone: '', guardian_phone: '', university: '', room_preference: '', seat_type: 'shared', move_in_date: '' }); setFiles({ photo: null, nid_front: null, nid_back: null }); setPreviews({ photo: null, nid_front: null, nid_back: null }); }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">🏠</div>
          <h1>Mess Registration</h1>
          <p>Fill in your details to apply for a room</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div className="reg-section">
            <h3 className="reg-section-title">Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div className="form-group">
                <label>Guardian's Phone</label>
                <input
                  type="tel"
                  name="guardian_phone"
                  value={form.guardian_phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>University / Institution</label>
                <input
                  type="text"
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="e.g. Begum Rokeya University"
                />
              </div>
            </div>
          </div>

          {/* Room Preference */}
          <div className="reg-section">
            <h3 className="reg-section-title">Room Preference</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Preferred Room (optional)</label>
                <input
                  type="text"
                  name="room_preference"
                  value={form.room_preference}
                  onChange={handleChange}
                  placeholder="e.g. 101, 2nd floor"
                />
              </div>
              <div className="form-group">
                <label>Seat Type *</label>
                <select name="seat_type" value={form.seat_type} onChange={handleChange}>
                  <option value="shared">Shared</option>
                  <option value="single">Single</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Move-in Date</label>
                <input
                  type="date"
                  name="move_in_date"
                  value={form.move_in_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Photo & Documents */}
          <div className="reg-section">
            <h3 className="reg-section-title">Photo & Documents</h3>
            <div className="upload-grid">

              {/* Profile Photo */}
              <div className="upload-box">
                <label className="upload-label" htmlFor="photo">
                  {previews.photo ? (
                    <img src={previews.photo} alt="Preview" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span>Your Photo *</span>
                      <small>Tap to upload</small>
                    </div>
                  )}
                </label>
                <input id="photo" type="file" accept="image/*" onChange={e => handleFile(e, 'photo')} style={{ display: 'none' }} />
                {previews.photo && <p className="upload-done">✅ Photo added</p>}
              </div>

              {/* NID Front */}
              <div className="upload-box">
                <label className="upload-label" htmlFor="nid_front">
                  {previews.nid_front ? (
                    <img src={previews.nid_front} alt="NID Front" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">🪪</span>
                      <span>NID Front *</span>
                      <small>Tap to upload</small>
                    </div>
                  )}
                </label>
                <input id="nid_front" type="file" accept="image/*" onChange={e => handleFile(e, 'nid_front')} style={{ display: 'none' }} />
                {previews.nid_front && <p className="upload-done">✅ NID front added</p>}
              </div>

              {/* NID Back */}
              <div className="upload-box">
                <label className="upload-label" htmlFor="nid_back">
                  {previews.nid_back ? (
                    <img src={previews.nid_back} alt="NID Back" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">🪪</span>
                      <span>NID Back *</span>
                      <small>Tap to upload</small>
                    </div>
                  )}
                </label>
                <input id="nid_back" type="file" accept="image/*" onChange={e => handleFile(e, 'nid_back')} style={{ display: 'none' }} />
                {previews.nid_back && <p className="upload-done">✅ NID back added</p>}
              </div>

            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Submit Registration'}
          </button>
        </form>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          background: #f0faf4;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 16px;
        }
        .register-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          width: 100%;
          max-width: 640px;
          overflow: hidden;
        }
        .register-header {
          background: var(--green, #1a7a4a);
          color: white;
          text-align: center;
          padding: 32px 24px 24px;
        }
        .register-logo { font-size: 40px; margin-bottom: 8px; }
        .register-header h1 { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
        .register-header p { opacity: 0.85; margin: 0; font-size: 14px; }
        .reg-section { padding: 24px 24px 0; }
        .reg-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--green, #1a7a4a);
          margin: 0 0 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e8f5ed;
        }
        form { padding-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input,
        .form-group select {
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          background: #fafafa;
        }
        .form-group input:focus,
        .form-group select:focus { border-color: var(--green, #1a7a4a); background: white; }
        .upload-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .upload-box { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .upload-label {
          width: 100%;
          aspect-ratio: 1;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s;
          background: #f9fafb;
        }
        .upload-label:hover { border-color: var(--green, #1a7a4a); }
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
          padding: 12px;
        }
        .upload-icon { font-size: 28px; }
        .upload-placeholder span { font-size: 12px; font-weight: 600; color: #374151; }
        .upload-placeholder small { font-size: 11px; color: #9ca3af; }
        .upload-preview { width: 100%; height: 100%; object-fit: cover; }
        .upload-done { font-size: 11px; color: var(--green, #1a7a4a); font-weight: 600; margin: 0; }
        .alert { margin: 0 24px 16px; padding: 12px 16px; border-radius: 8px; font-size: 14px; }
        .alert-error { background: #fef2f2; color: #c0392b; border: 1px solid #fecaca; }
        .btn-block { display: block; width: calc(100% - 48px); margin: 16px 24px 0; }
        .register-success {
          padding: 48px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .success-icon { font-size: 56px; }
        .register-success h2 { font-size: 22px; font-weight: 700; margin: 0; color: #111827; }
        .register-success p { color: #6b7280; margin: 0; font-size: 15px; max-width: 320px; }
        .success-note { background: #f0faf4; padding: 12px 16px; border-radius: 8px; color: #374151 !important; font-size: 13px !important; }
        @media (max-width: 480px) {
          .form-grid { grid-template-columns: 1fr; }
          .upload-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
