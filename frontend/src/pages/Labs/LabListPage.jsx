import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as labApi from "../../api/labApi.js";
import { useAuth } from "../../context/AuthContext.jsx";

function LabListPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [editingLabId, setEditingLabId] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    async function load() {
      try {
        const data = await labApi.getLabs();
        setLabs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmitLab = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingLabId) {
        const updatedLab = await labApi.updateLab(editingLabId, {
          name,
          code,
          department
        });
        setLabs((prev) =>
          prev.map((lab) => (lab._id === updatedLab._id ? updatedLab : lab))
        );
      } else {
        const newLab = await labApi.createLab({ name, code, department });
        setLabs((prev) => [...prev, newLab]);
      }
      setName("");
      setCode("");
      setDepartment("");
      setEditingLabId(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${editingLabId ? "update" : "create"} lab`
      );
    }
  };

  const handleEditLab = (lab) => {
    setEditingLabId(lab._id);
    setName(lab.name || "");
    setCode(lab.code || "");
    setDepartment(lab.department || "");
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingLabId(null);
    setName("");
    setCode("");
    setDepartment("");
    setError("");
  };

  if (loading) return <p>Loading labs...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Labs</h1>
      </div>

      <div className="page-columns">
        <section className="page-main">
          {labs.length === 0 ? (
            <p>No labs yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab._id}>
                    <td>{lab.code}</td>
                    <td>{lab.name}</td>
                    <td>{lab.department}</td>
                    <td>
                      <Link className="link" to={`/labs/${lab._id}`}>
                        View
                      </Link>
                      {isAdmin && (
                        <button
                          className="link"
                          type="button"
                          onClick={() => handleEditLab(lab)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="page-aside">
          {isAdmin ? (
            <>
              <h2>{editingLabId ? "Edit Lab" : "Add New Lab"}</h2>
              <form onSubmit={handleSubmitLab} className="form-vertical">
                <label>
                  Code
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Department
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </label>
                {error && <div className="error-text">{error}</div>}
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit">
                    {editingLabId ? "Save Changes" : "Create Lab"}
                  </button>
                  {editingLabId && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <p className="muted-text">Only admins can add or edit labs.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default LabListPage;
