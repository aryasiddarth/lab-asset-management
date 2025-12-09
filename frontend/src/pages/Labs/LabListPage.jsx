import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as labApi from "../../api/labApi.js";

function LabListPage() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");

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

  const handleCreateLab = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const newLab = await labApi.createLab({ name, code, department });
      setLabs((prev) => [...prev, newLab]);
      setName("");
      setCode("");
      setDepartment("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create lab");
    }
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="page-aside">
          <h2>Add New Lab</h2>
          <form onSubmit={handleCreateLab} className="form-vertical">
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
              />
            </label>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary" type="submit">
              Create Lab
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

export default LabListPage;
