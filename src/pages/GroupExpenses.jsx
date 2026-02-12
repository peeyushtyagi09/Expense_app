// import { useParams, Link } from "react-router-dom";

// function GroupExpenses() {
//     // 1. Get the groupId from the URL
//     const { groupId } = useParams();

//     return (
//         <div className="container py-5">
//             <nav aria-label="breadcrumb">
//                 <ol className="breadcrumb">
//                     <li className="breadcrumb-item">
//                         <Link to="/dashboard">Groups</Link>
//                     </li>
//                     <li className="breadcrumb-item active">Expense Details</li>
//                 </ol>
//             </nav>

//             <div className="bg-white p-5 rounded-4 shadow-sm text-center border">
//                 <div className="mb-4">
//                     <i className="bi bi-wallet2 display-1 text-primary opacity-25"></i>
//                 </div>
//                 <h2 className="fw-bold">Group Expense Manager</h2>
//                 <p className="text-muted">
//                     Working with Group ID:{" "}
//                     <code className="bg-light px-2 rounded">{groupId}</code>
//                 </p>

//                 <hr className="my-5" />

//                 <div className="alert alert-info d-inline-block px-5">
//                     <h5>🛠️ Student Assignment</h5>
//                     <p className="mb-0">Implement the following here:</p>
//                     <ul className="text-start mt-3">
//                         <li>
//                             Fetch and display group details (Name, Members).
//                         </li>
//                         <li>
//                             Show a list of past transactions for this group.
//                         </li>
//                         <li>
//                             Add a form to create a new expense with title,
//                             amount, and split logic.
//                         </li>
//                     </ul>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default GroupExpenses;






import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";

function GroupExpenses() {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [balances, setBalances] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Expense Form State
    const [description, setDescription] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [splits, setSplits] = useState([]); // Array of {userEmail, amount, isExcluded}

    // const fetchData = async () => {
    //     try {
    //         setLoading(true);
    //         // 1. Fetch Group Details

    //         const groupRes = await axios.get(`${serverEndpoint}/groups/${groupId}`, { withCredentials: true });
    //         setGroup(groupRes.data);
            
    //         // 2. Fetch Group Summary (Balances)
    //         const summaryRes = await axios.get(`${serverEndpoint}/expenses/summary/${groupId}`, { withCredentials: true });
    //         setBalances(summaryRes.data);
            
    //         // Initialize split logic with group members
    //         if (groupRes.data.membersEmail) {
    //             setSplits(groupRes.data.membersEmail.map(email => ({
    //                 userEmail: email,
    //                 amount: 0,
    //                 isExcluded: false
    //             })));
    //         }
    //     } catch (err) {
    //         console.error("Fetch Error:", err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Fetch Group Details to get the member list
            const groupRes = await axios.get(`${serverEndpoint}/api/groups/${groupId}`, { withCredentials: true });
            setGroup(groupRes.data);
            
            // 2. Fetch current balances
            const summaryRes = await axios.post(`${serverEndpoint}/api/expenses/summary/${groupId}`, 
                { membersEmail: groupRes.data.membersEmail }, 
                { withCredentials: true }
            );
            setBalances(summaryRes.data);
            
            // 3. IMPORTANT: Initialize the splits state with the members found
            if (groupRes.data.membersEmail && groupRes.data.membersEmail.length > 0) {
                const initialSplits = groupRes.data.membersEmail.map(email => ({
                    userEmail: email,
                    amount: 0,
                    isExcluded: false
                }));
                setSplits(initialSplits);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const total = parseFloat(totalAmount);
        const sumOfSplits = splits.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);

        if (Math.abs(total - sumOfSplits) > 0.1) {
            alert(`Total amount (₹${total}) must match the sum of splits (₹${sumOfSplits})`);
            return;
        }

        try {
            await axios.post(`${serverEndpoint}/api/expenses/add`, {
                groupId,
                description,
                totalAmount: total,
                splitDetails: splits
            }, { withCredentials: true });
            
            // Reset and Refresh
            setDescription("");
            setTotalAmount("");
            fetchData();
        } catch (err) {
            alert("Failed to add expense");
        }
    };

    const handleSettleGroup = async () => {
        if (!window.confirm("Mark this group as settled? All balances will reset.")) return;
        try {
            await axios.patch(`${serverEndpoint}/api/groups/settle/${groupId}`, {}, { withCredentials: true });
            fetchData();
            alert("Group settled successfully!");
        } catch (err) {
            alert("Settlement failed");
        }
    };

    const handleSplitEqually = () => {
        const total = parseFloat(totalAmount);
        if (!total || total <= 0) {
            alert("Please enter a total amount first.");
            return;
        }
    
        // Filter to find members who are not excluded
        const includedMembers = splits.filter(s => !s.isExcluded);
        
        if (includedMembers.length === 0) {
            alert("At least one member must be included in the split.");
            return;
        }
    
        // Calculate the share per person
        const share = (total / includedMembers.length).toFixed(2);
    
        // Update the splits state
        const newSplits = splits.map(s => ({
            ...s,
            amount: s.isExcluded ? 0 : share
        }));
    
        setSplits(newSplits);
    };

    useEffect(() => { fetchData(); }, [groupId]);

    if (loading) return <div className="container py-5 text-center">Loading...</div>;

    return (
        <div className="container py-5">
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/dashboard">Groups</Link></li>
                    <li className="breadcrumb-item active">{group?.name || 'Expenses'}</li>
                </ol>
            </nav>

            <div className="row g-4">
                {/* Left Side: Summary & Settle */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
                        <h4 className="fw-bold mb-3">Net Balance</h4>
                        <div className="list-group list-group-flush mb-4">
                            {Object.entries(balances).map(([email, bal]) => (
                                <div key={email} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span className="small text-muted text-truncate me-2">{email}</span>
                                    <span className={`fw-bold ${bal >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {bal >= 0 ? `+₹${bal}` : `-₹${Math.abs(bal)}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-outline-success w-100 rounded-pill fw-bold" onClick={handleSettleGroup}>
                            Settle Group
                        </button>
                    </div>
                </div>

                {/* Right Side: Add Expense Form */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4 p-4">
                        <h4 className="fw-bold mb-4">Add Expense</h4>
                        <form onSubmit={handleAddExpense}>
                            <div className="row g-3 mb-4">
                                <div className="col-md-7">
                                    <label className="form-label small fw-bold">Description</label>
                                    <input type="text" className="form-control" value={description} 
                                        onChange={(e) => setDescription(e.target.value)} required placeholder="Dinner, Movie, etc." />
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label small fw-bold">Total Amount</label>
                                    <input type="number" className="form-control" value={totalAmount} 
                                        onChange={(e) => setTotalAmount(e.target.value)} required placeholder="0.00" />
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0 text-primary text-uppercase small">Split Unequally / Exclude</h6>
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                    onClick={handleSplitEqually}
                                >
                                    Split Equally
                                </button>
                            </div>

                            {/* <h6 className="fw-bold mb-3 text-primary text-uppercase small">Split Unequally / Exclude</h6> */}
                            <div className="bg-light p-3 rounded-3">
                                {splits.map((split, index) => (
                                    <div key={split.userEmail} className="row align-items-center mb-2">
                                        <div className="col-6 col-md-7 d-flex align-items-center">
                                            <input type="checkbox" className="form-check-input me-2" 
                                                checked={!split.isExcluded} 
                                                onChange={(e) => {
                                                    const newSplits = [...splits];
                                                    newSplits[index].isExcluded = !e.target.checked;
                                                    if (newSplits[index].isExcluded) newSplits[index].amount = 0;
                                                    setSplits(newSplits);
                                                }} 
                                            />
                                            <span className="text-truncate small">{split.userEmail}</span>
                                        </div>
                                        <div className="col-6 col-md-5">
                                            <input type="number" className="form-control form-control-sm" 
                                                placeholder="Share" disabled={split.isExcluded}
                                                value={split.amount}
                                                onChange={(e) => {
                                                    const newSplits = [...splits];
                                                    newSplits[index].amount = e.target.value;
                                                    setSplits(newSplits);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="btn btn-primary w-100 mt-4 py-2 rounded-pill fw-bold shadow-sm">
                                Save Expense
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GroupExpenses;