import { useState } from 'react';
import api, { errMsg } from './api';
import { Announcements, Attendance, Leaves, Training, Employees } from './Pages.jsx';

function Login({ onLogin }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', f);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) { setErr(errMsg(e)); }
  };
  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
      <div className="card shadow-sm"><div className="card-body">
        <h3 className="text-center mb-1">StaffSync</h3>
        <p className="text-center text-muted">Human resource management</p>
        {err && <div className="alert alert-danger py-2">{err}</div>}
        <form onSubmit={submit}>
          <input className="form-control mb-2" type="email" placeholder="Email" required
            onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input className="form-control mb-3" type="password" placeholder="Password" required
            onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button className="btn btn-primary w-100">Login</button>
        </form>
        <small className="text-muted d-block mt-3">
          Demo: hr@ / manager@ / employee@staffsync.com — password123
        </small>
      </div></div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [tab, setTab] = useState('announcements');

  if (!user) return <Login onLogin={setUser} />;

  const tabs = [
    ['announcements', 'Announcements', true],
    ['attendance', 'Attendance', true],
    ['leaves', 'Leaves', true],
    ['training', 'Training', true],
    ['employees', 'Employees', user.role !== 'employee'],
  ].filter((t) => t[2]);

  const logout = () => { localStorage.clear(); setUser(null); };
  const views = {
    announcements: <Announcements user={user} />, attendance: <Attendance user={user} />,
    leaves: <Leaves user={user} />, training: <Training user={user} />, employees: <Employees user={user} />,
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-primary px-3">
        <span className="navbar-brand fw-bold">StaffSync</span>
        <span className="text-white">
          {user.name} <span className="badge bg-light text-primary text-uppercase">{user.role}</span>
          <button className="btn btn-sm btn-outline-light ms-3" onClick={logout}>Logout</button>
        </span>
      </nav>
      <div className="container py-3">
        <ul className="nav nav-pills mb-3">
          {tabs.map(([k, label]) => (
            <li className="nav-item" key={k}>
              <button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
            </li>
          ))}
        </ul>
        {views[tab]}
      </div>
    </>
  );
}
