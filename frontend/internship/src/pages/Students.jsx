import React, { useEffect, useState } from "react";
import API from "../api/axios"; // Your configured axios instance

const Students = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "",
    department: "",
    startDate: "",
    endDate: "",
  });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState({
    fetch: false,
    submit: false,
    delete: false,
    offer: null,
    completion: null,
  });

  // ✅ Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading((prev) => ({ ...prev, fetch: true }));
      const { data } = await API.get("/students");
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
      setMsg("❌ Failed to fetch students.");
    } finally {
      setLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ✅ Add or update student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, submit: true }));
    try {
      if (editing) {
        await API.put(`/students/${editing}`, form);
        setMsg("✅ Student updated successfully!");
      } else {
        await API.post("/students", form);
        setMsg("✅ Student added successfully!");
      }
      setForm({
        name: "",
        email: "",
        college: "",
        department: "",
        startDate: "",
        endDate: "",
      });
      setEditing(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      setMsg("❌ Error while saving student!");
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
      setTimeout(() => setMsg(""), 3000);
    }
  };

  // ✅ Edit
  const handleEdit = (s) => {
    setEditing(s.id);
    setForm({
      name: s.name,
      email: s.email,
      college: s.college,
      department: s.department,
      startDate: s.startDate || "",
      endDate: s.endDate || "",
    });
  };

  // ✅ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      await API.delete(`/students/${id}`);
      setMsg("🗑️ Student deleted successfully!");
      fetchStudents();
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to delete student.");
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setTimeout(() => setMsg(""), 3000);
    }
  };

  // ✅ Send Offer Letter
  const sendOffer = async (studentId) => {
    setLoading((prev) => ({ ...prev, offer: studentId }));
    try {
      await API.post(`/admin/send-offer`, { studentId });
      setMsg("📨 Offer letter sent successfully!");
      fetchStudents();
    } catch (error) {
      console.error("Error sending offer:", error);
      setMsg("❌ Failed to send offer letter.");
    } finally {
      setLoading((prev) => ({ ...prev, offer: null }));
      setTimeout(() => setMsg(""), 3000);
    }
  };

  // ✅ Send Completion Certificate
  const sendCompletion = async (studentId) => {
    setLoading((prev) => ({ ...prev, completion: studentId }));
    try {
      await API.post(`/admin/send-completion`, { studentId });
      setMsg("🎓 Completion certificate sent successfully!");
      fetchStudents();
    } catch (error) {
      console.error("Error sending completion:", error);
      setMsg("❌ Failed to send completion certificate.");
    } finally {
      setLoading((prev) => ({ ...prev, completion: null }));
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Students</h2>
      {msg && (
        <div
          style={{
            color: msg.includes("❌") ? "red" : "green",
            marginBottom: 10,
          }}
        >
          {msg}
        </div>
      )}

      {/* 🧾 Student Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="College"
          value={form.college}
          onChange={(e) => setForm({ ...form, college: e.target.value })}
        />
        <input
          placeholder="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
        <button type="submit" disabled={loading.submit}>
          {loading.submit
            ? editing
              ? "Updating..."
              : "Adding..."
            : editing
            ? "Update"
            : "Add"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({
                name: "",
                email: "",
                college: "",
                department: "",
                startDate: "",
                endDate: "",
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* 🧠 Students Table */}
      {loading.fetch ? (
        <p>Loading students...</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>College</th>
              <th>Department</th>
              <th>Start</th>
              <th>End</th>
              <th>Offer</th>
              <th>Completion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.college}</td>
                <td>{s.department}</td>
                <td>{s.startDate}</td>
                <td>{s.endDate}</td>
                <td>{s.offerSent ? "✅" : "❌"}</td>
                <td>{s.completionSent ? "✅" : "❌"}</td>
                <td>
                  <button onClick={() => handleEdit(s)} disabled={loading.submit}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={loading.delete}
                  >
                    {loading.delete ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() => sendOffer(s.id)}
                    disabled={loading.offer === s.id || s.offerSent}
                  >
                    {loading.offer === s.id
                      ? "Sending..."
                      : s.offerSent
                      ? "Sent"
                      : "Send Offer"}
                  </button>
                  <button
                    onClick={() => sendCompletion(s.id)}
                    disabled={loading.completion === s.id || s.completionSent}
                  >
                    {loading.completion === s.id
                      ? "Sending..."
                      : s.completionSent
                      ? "Sent"
                      : "Send Completion"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Students;
