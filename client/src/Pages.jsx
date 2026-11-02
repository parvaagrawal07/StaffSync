import { useEffect, useState } from 'react';
import api, { errMsg } from './api';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '-');
const time = (d) => (d ? new Date(d).toLocaleTimeString() : '-');
const badge = { pending: 'warning', approved: 'success', rejected: 'danger' };

function useList(url) {
  const [items, setItems] = useState([]);
  const load = () => api.get(url).then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, [url]);
  return [items, load];
}
const run = async (fn, reload) => {
  try { await fn(); reload && reload(); } catch (e) { alert(errMsg(e)); }
};

// ---------------- Announcements ----------------
export function Announcements({ user }) {
  const [items, load] = useList('/announcements');
  const [f, setF] = useState({ title: '', body: '' });
  return (
    <div>
      {user.role === 'hr' && (
        <div className="card card-body mb-3">
          <input className="form-control mb-2" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea className="form-control mb-2" placeholder="Announcement / news" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <button className="btn btn-primary align-self-start"
            onClick={() => run(async () => { await api.post('/announcements', f); setF({ title: '', body: '' }); }, load)}>Post</button>
        </div>
      )}
      {items.length === 0 && <p className="text-muted">No announcements yet.</p>}
      {items.map((a) => (
        <div className="card mb-2" key={a._id}><div className="card-body">
          <h5>{a.title}</h5><p className="mb-1">{a.body}</p>
          <small className="text-muted">{a.author?.name} · {fmt(a.createdAt)}</small>
          {user.role === 'hr' && <button className="btn btn-sm btn-outline-danger float-end"
            onClick={() => run(() => api.delete(`/announcements/${a._id}`), load)}>Delete</button>}
        </div></div>
      ))}
    </div>
  );
}

// ---------------- Attendance ----------------
export function Attendance({ user }) {
  const [mine, loadMine] = useList('/attendance/mine');
  const [all, loadAll] = useList(user.role === 'hr' ? '/attendance' : '/attendance/mine');
  const reload = () => { loadMine(); loadAll(); };
  const rows = user.role === 'hr' ? all : mine;
  return (
    <div>
      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={() => run(() => api.post('/attendance/checkin'), reload)}>Check In</button>
        <button className="btn btn-secondary" onClick={() => run(() => api.post('/attendance/checkout'), reload)}>Check Out</button>
      </div>
      <table className="table table-striped">
        <thead><tr>{user.role === 'hr' && <th>Employee</th>}<th>Date</th><th>Check In</th><th>Check Out</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r._id}>{user.role === 'hr' && <td>{r.user?.name}</td>}<td>{r.date}</td><td>{time(r.checkIn)}</td><td>{time(r.checkOut)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ---------------- Leaves ----------------
export function Leaves({ user }) {
  const [mine, loadMine] = useList('/leaves/mine');
  const [team, loadTeam] = useList(user.role === 'employee' ? '/leaves/mine' : '/leaves');
  const [f, setF] = useState({ type: 'Casual', from: '', to: '', reason: '' });
  const reload = () => { loadMine(); loadTeam(); };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      <div className="card card-body mb-3">
        <h6>Apply for leave</h6>
        <div className="row g-2">
          <div className="col-md-2"><select className="form-select" value={f.type} onChange={set('type')}>
            <option>Casual</option><option>Sick</option><option>Annual</option></select></div>
          <div className="col-md-2"><input type="date" className="form-control" value={f.from} onChange={set('from')} /></div>
          <div className="col-md-2"><input type="date" className="form-control" value={f.to} onChange={set('to')} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Reason" value={f.reason} onChange={set('reason')} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100"
            onClick={() => run(async () => { await api.post('/leaves', f); setF({ ...f, reason: '' }); }, reload)}>Apply</button></div>
        </div>
      </div>
      <h6>My leaves</h6>
      <LeaveTable rows={mine} />
      {user.role !== 'employee' && (<>
        <h6 className="mt-4">{user.role === 'hr' ? 'All leave requests' : 'Team leave requests'}</h6>
        <LeaveTable rows={team} showUser
          actions={(l) => l.status === 'pending' && (<>
            <button className="btn btn-sm btn-success me-1" onClick={() => run(() => api.patch(`/leaves/${l._id}`, { status: 'approved' }), reload)}>Approve</button>
            <button className="btn btn-sm btn-danger" onClick={() => run(() => api.patch(`/leaves/${l._id}`, { status: 'rejected' }), reload)}>Reject</button>
          </>)} />
      </>)}
    </div>
  );
}
function LeaveTable({ rows, showUser, actions }) {
  return (
    <table className="table table-striped">
      <thead><tr>{showUser && <th>Employee</th>}<th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th>{actions && <th></th>}</tr></thead>
      <tbody>{rows.map((l) => (
        <tr key={l._id}>{showUser && <td>{l.user?.name}</td>}<td>{l.type}</td><td>{fmt(l.from)}</td><td>{fmt(l.to)}</td><td>{l.reason}</td>
          <td><span className={`badge bg-${badge[l.status]}`}>{l.status}</span></td>{actions && <td>{actions(l)}</td>}</tr>
      ))}</tbody>
    </table>
  );
}

// ---------------- Training ----------------
export function Training({ user }) {
  const [items, load] = useList('/training');
  const [f, setF] = useState({ title: '', description: '', date: '' });
  const canManage = user.role !== 'employee';
  return (
    <div>
      {canManage && (
        <div className="card card-body mb-3"><div className="row g-2">
          <div className="col-md-3"><input className="form-control" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="col-md-3"><input type="date" className="form-control" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          <div className="col-md-2"><button className="btn btn-primary w-100"
            onClick={() => run(async () => { await api.post('/training', f); setF({ title: '', description: '', date: '' }); }, load)}>Add</button></div>
        </div></div>
      )}
      <div className="row">{items.map((t) => (
        <div className="col-md-4 mb-3" key={t._id}><div className="card h-100"><div className="card-body">
          <h5>{t.title}</h5><p>{t.description}</p>
          <small className="text-muted d-block mb-2">{fmt(t.date)} · {t.attendees.length} enrolled</small>
          <button className="btn btn-sm btn-outline-primary me-2" disabled={t.attendees.includes(user._id)}
            onClick={() => run(() => api.post(`/training/${t._id}/enroll`), load)}>
            {t.attendees.includes(user._id) ? 'Enrolled' : 'Enroll'}</button>
          {canManage && <button className="btn btn-sm btn-outline-danger" onClick={() => run(() => api.delete(`/training/${t._id}`), load)}>Delete</button>}
        </div></div></div>
      ))}</div>
    </div>
  );
}

// ---------------- Employees ----------------
export function Employees({ user }) {
  const [items, load] = useList('/users');
  const [managers] = useList('/users');
  const empty = { name: '', email: '', password: '', role: 'employee', department: '', position: '', manager: '' };
  const [f, setF] = useState(empty);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div>
      {user.role === 'hr' && (
        <div className="card card-body mb-3">
          <h6>Add employee</h6>
          <div className="row g-2">
            <div className="col-md-3"><input className="form-control" placeholder="Name" value={f.name} onChange={set('name')} /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Email" value={f.email} onChange={set('email')} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="Password" value={f.password} onChange={set('password')} /></div>
            <div className="col-md-2"><select className="form-select" value={f.role} onChange={set('role')}>
              <option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option></select></div>
            <div className="col-md-2"><input className="form-control" placeholder="Department" value={f.department} onChange={set('department')} /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Position" value={f.position} onChange={set('position')} /></div>
            <div className="col-md-3"><select className="form-select" value={f.manager} onChange={set('manager')}>
              <option value="">No manager</option>
              {managers.filter((m) => m.role === 'manager').map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}</select></div>
            <div className="col-md-2"><button className="btn btn-primary w-100"
              onClick={() => run(async () => { await api.post('/users', f); setF(empty); }, load)}>Add</button></div>
          </div>
        </div>
      )}
      <table className="table table-striped">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Position</th><th>Manager</th>{user.role === 'hr' && <th></th>}</tr></thead>
        <tbody>{items.map((u) => (
          <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.department}</td><td>{u.position}</td><td>{u.manager?.name || '-'}</td>
            {user.role === 'hr' && <td><button className="btn btn-sm btn-outline-danger"
              onClick={() => confirm('Delete this employee?') && run(() => api.delete(`/users/${u._id}`), load)}>Delete</button></td>}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}
