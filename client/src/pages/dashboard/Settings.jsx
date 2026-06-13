import { useEffect, useState } from "react";
import { FaUser, FaLock, FaEnvelope, FaPhone, FaSave, FaShieldAlt } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";

const Settings = () => {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/audit-logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAuditLogs(response.data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchPurchaseOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/purchase-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error("Failed to load purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === "po") {
      fetchPurchaseOrders();
    }
  }, [activeTab]);

  // RBAC User Permission management states & handlers
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editPermissions, setEditPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsersList(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPermissions(user.permissions || []);
  };

  const handleTogglePermission = (perm) => {
    if (editPermissions.includes(perm)) {
      setEditPermissions(editPermissions.filter(p => p !== perm));
    } else {
      setEditPermissions([...editPermissions, perm]);
    }
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSavingPermissions(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(`/users/${selectedUser._id}/permissions`, {
        role: editRole,
        permissions: editPermissions,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast.success("Permissions updated successfully!");
      
      // Update in local state list
      setUsersList(usersList.map(u => u._id === selectedUser._id ? {
        ...u,
        role: editRole,
        permissions: editPermissions,
      } : u));
      
      // If updating our own permissions, refresh
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id === selectedUser._id) {
        localStorage.setItem("user", JSON.stringify({
          ...currentUser,
          role: editRole,
          permissions: editPermissions,
        }));
      }

      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update user permissions:", error);
      toast.error(error.response?.data?.message || "Failed to update user permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Fetch current user details
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data.user;
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Input Changes
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit Profile Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);

    try {
      const token = localStorage.getItem("token");
      const response = await API.put(
        "/users/profile",
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Profile updated successfully!");
      
      // Update local storage user data
      const updatedUser = response.data.user;
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
        })
      );
      
      // Force quick local layout refresh
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Submit Password Changes
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New passwords do not match!");
    }

    if (passwordData.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters long");
    }

    setLoadingPassword(true);

    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/users/profile",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoadingPassword(false);
    }
  };

  // Define badge styles for user roles
  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-rose-500/10 text-rose-500 border-rose-500/25";
      case "manager":
        return "bg-amber-500/10 text-amber-500 border-amber-500/25";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/25";
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-main">Account Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage your personal profile information, system credentials, and account options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Profile Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            {/* Visual background element */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-border-color/30" />
            
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-indigo-600/10 border-4 border-bg-card flex items-center justify-center text-indigo-500 text-3xl font-bold mt-8 shadow-sm relative z-10">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : "?"}
            </div>

            <h2 className="text-lg font-bold text-text-main mt-4 relative z-10">{profileData.name || "User"}</h2>
            <p className="text-text-secondary text-xs mt-1 relative z-10">{profileData.email}</p>

            {/* Role Badge */}
            <div className="mt-4 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeClass(profileData.role)}`}>
                <FaShieldAlt className="text-[9px]" />
                {profileData.role || "Role"}
              </span>
            </div>

            <div className="w-full border-t border-border-color/60 my-6" />

            <div className="w-full text-left space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center text-text-secondary shrink-0 border border-border-color/60">
                  <FaUser className="text-[10px]" />
                </span>
                <div>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Full Name</p>
                  <p className="text-text-main font-semibold mt-0.5">{profileData.name || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center text-text-secondary shrink-0 border border-border-color/60">
                  <FaEnvelope className="text-[10px]" />
                </span>
                <div>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-text-main font-semibold mt-0.5">{profileData.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center text-text-secondary shrink-0 border border-border-color/60">
                  <FaPhone className="text-[10px]" />
                </span>
                <div>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="text-text-main font-semibold mt-0.5">{profileData.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Selector */}
          {(profileData.role === "admin" || profileData.role === "manager") && (
            <div className="flex border-b border-border-color/60 gap-6 mb-4">
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === "profile"
                    ? "border-indigo-500 text-indigo-500"
                    : "border-transparent text-text-secondary hover:text-text-main"
                }`}
              >
                Profile & Security
              </button>
              <button
                onClick={() => setActiveTab("po")}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === "po"
                    ? "border-indigo-500 text-indigo-500"
                    : "border-transparent text-text-secondary hover:text-text-main"
                }`}
              >
                Purchase Orders
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === "audit"
                    ? "border-indigo-500 text-indigo-500"
                    : "border-transparent text-text-secondary hover:text-text-main"
                }`}
              >
                Action Audit Logs
              </button>
              {profileData.role === "admin" && (
                <button
                  onClick={() => setActiveTab("users")}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "users"
                      ? "border-indigo-500 text-indigo-500"
                      : "border-transparent text-text-secondary hover:text-text-main"
                  }`}
                >
                  Users & RBAC Settings
                </button>
              )}
            </div>
          )}

          {activeTab === "profile" ? (
            <div className="space-y-8">
              {/* Profile Details Form */}
              <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-text-main mb-1 tracking-tight flex items-center gap-2">
                  <FaUser className="text-indigo-500 text-sm" /> Profile Details
                </h2>
                <p className="text-text-secondary text-xs mb-6">
                  Update your public metadata like name, contact info, and registration details
                </p>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      label="Display Name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Enter full name"
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="name@example.com"
                    />

                    <Input
                      label="Phone Number"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="+94 XX XXX XXXX"
                      required={false}
                    />

                    <div>
                      <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">
                        Account Role
                      </label>
                      <input
                        type="text"
                        disabled
                        value={profileData.role ? profileData.role.toUpperCase() : "LOADING..."}
                        className="w-full bg-bg-main border border-border-color text-text-secondary opacity-60 px-4 py-2.5 rounded-xl outline-none text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={loadingProfile}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-lg shadow-indigo-600/10"
                    >
                      <FaSave className="text-xs" />
                      {loadingProfile ? "Saving Details..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-text-main mb-1 tracking-tight flex items-center gap-2">
                  <FaLock className="text-indigo-500 text-sm" /> Security & Password
                </h2>
                <p className="text-text-secondary text-xs mb-6">
                  Ensure your account is secure by creating a robust password
                </p>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                    />

                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 6 chars"
                    />

                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={loadingPassword}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-lg shadow-indigo-600/10"
                    >
                      <FaLock className="text-xs" />
                      {loadingPassword ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === "po" ? (
            /* Purchase Orders Panel */
            <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text-main tracking-tight flex items-center gap-2">
                    <FaEnvelope className="text-indigo-500 text-sm" /> Automated Purchase Orders (POs)
                  </h2>
                  <p className="text-text-secondary text-xs mt-1">
                    Trace automated low-stock reorder loops, email delivery status, and supplier confirmation arrivals.
                  </p>
                </div>
                <button
                  onClick={fetchPurchaseOrders}
                  disabled={loadingOrders}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  {loadingOrders ? "Refreshing..." : "Refresh Orders"}
                </button>
              </div>

              {loadingOrders ? (
                <div className="space-y-3 py-6">
                  <div className="h-6 bg-border-color/20 animate-pulse rounded" />
                  <div className="h-20 bg-border-color/10 animate-pulse rounded" />
                  <div className="h-20 bg-border-color/10 animate-pulse rounded" />
                </div>
              ) : purchaseOrders.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-sm">
                  No purchase orders dispatched yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-color text-text-secondary font-semibold">
                        <th className="py-3 pr-4 uppercase tracking-wider">PO Ref</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Product Name</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Qty Order</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Total Price</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Supplier</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Status</th>
                        <th className="py-3 pr-4 uppercase tracking-wider text-center">PDF Doc</th>
                        <th className="py-3 uppercase tracking-wider text-right">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/50">
                      {purchaseOrders.map((po) => {
                        let statusColor = "bg-slate-500/10 text-slate-500 border border-slate-500/10";
                        if (po.status === "completed") statusColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15";
                        if (po.status === "shipped") statusColor = "bg-blue-500/10 text-blue-500 border border-blue-500/15";
                        if (po.status === "pending") statusColor = "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15";

                        return (
                          <tr key={po._id} className="hover:bg-bg-main/40 transition-colors">
                            <td className="py-3.5 pr-4 font-semibold text-text-main font-mono">
                              #PO-{po._id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3.5 pr-4">
                              <div className="font-semibold text-text-main">{po.productName}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5 tracking-wider font-mono">SKU: {po.sku || "N/A"}</div>
                            </td>
                            <td className="py-3.5 pr-4 text-text-main font-semibold">
                              {po.quantity} pcs
                            </td>
                            <td className="py-3.5 pr-4 text-emerald-500 font-bold">
                              Rs. {po.totalPrice.toLocaleString()}
                            </td>
                            <td className="py-3.5 pr-4 text-text-secondary">
                              <div className="font-semibold text-text-main">{po.supplier?.name || "—"}</div>
                              <div className="text-[10px] mt-0.5">{po.supplier?.email || ""}</div>
                            </td>
                            <td className="py-3.5 pr-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 text-center">
                              {po.pdfPath ? (
                                <a
                                  href={`http://localhost:5000${po.pdfPath}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-500 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                                >
                                  View PO PDF
                                </a>
                              ) : (
                                <span className="text-text-secondary/50">—</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right text-text-secondary">
                              <div>{new Date(po.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] mt-0.5 text-text-secondary/70">{new Date(po.createdAt).toLocaleTimeString()}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "users" ? (
            /* Users & RBAC Settings Panel */
            <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text-main tracking-tight flex items-center gap-2">
                    <FaUser className="text-indigo-500 text-sm" /> Users & Permissions (RBAC)
                  </h2>
                  <p className="text-text-secondary text-xs mt-1">
                    Manage store users, configure roles, and toggle granular permissions for cashiers and managers.
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  {loadingUsers ? "Refreshing..." : "Refresh Users"}
                </button>
              </div>

              {loadingUsers ? (
                <div className="space-y-3 py-6">
                  <div className="h-6 bg-border-color/20 animate-pulse rounded" />
                  <div className="h-20 bg-border-color/10 animate-pulse rounded" />
                  <div className="h-20 bg-border-color/10 animate-pulse rounded" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Users list */}
                  <div className={`${selectedUser ? "lg:col-span-6" : "lg:col-span-12"} transition-all duration-300 overflow-x-auto`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border-color text-text-secondary font-semibold">
                          <th className="py-3 pr-4 uppercase tracking-wider">Name / Email</th>
                          <th className="py-3 pr-4 uppercase tracking-wider">Role</th>
                          <th className="py-3 pr-4 uppercase tracking-wider">Permissions</th>
                          <th className="py-3 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color/50">
                        {usersList.map((user) => {
                          const isSelected = selectedUser && selectedUser._id === user._id;
                          return (
                            <tr
                              key={user._id}
                              className={`hover:bg-bg-main/40 transition-colors ${
                                isSelected ? "bg-indigo-500/5 hover:bg-indigo-500/10" : ""
                              }`}
                            >
                              <td className="py-3.5 pr-4">
                                <div className="font-semibold text-text-main">{user.name}</div>
                                <div className="text-[10px] text-text-secondary mt-0.5">{user.email}</div>
                              </td>
                              <td className="py-3.5 pr-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getRoleBadgeClass(user.role)}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-3.5 pr-4">
                                {user.role === "admin" ? (
                                  <span className="text-[10px] text-indigo-500 font-semibold">All Privileges</span>
                                ) : user.permissions && user.permissions.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 col-gap-1">
                                    {user.permissions.map(p => (
                                      <span key={p} className="bg-bg-main text-text-secondary border border-border-color/80 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider">
                                        {p.replace("_", " ")}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-rose-500 font-semibold">No Permissions</span>
                                )}
                              </td>
                              <td className="py-3.5 text-right">
                                {user.role !== "admin" ? (
                                  <button
                                    onClick={() => handleSelectUser(user)}
                                    className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded text-[10px] font-bold uppercase transition-all"
                                  >
                                    Manage
                                  </button>
                                ) : (
                                  <span className="text-text-secondary/50 text-[10px] font-medium italic">Owner</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Edit role/permissions */}
                  {selectedUser && (
                    <div className="lg:col-span-6 border border-border-color/60 bg-bg-main/30 rounded-xl p-5 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-border-color/60 pb-3">
                        <div>
                          <h3 className="font-bold text-text-main text-sm">Manage Permissions</h3>
                          <p className="text-[11px] text-text-secondary mt-0.5">{selectedUser.name}</p>
                        </div>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="text-text-secondary hover:text-rose-500 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleSavePermissions} className="space-y-6">
                        {/* Select Role */}
                        <div>
                          <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">
                            Assigned Role
                          </label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full border border-border-color bg-bg-card text-text-main px-4 py-2.5 rounded-xl outline-none text-sm cursor-pointer focus:border-indigo-500 transition-all"
                          >
                            <option value="manager">Manager</option>
                            <option value="cashier">Cashier</option>
                          </select>
                        </div>

                        {/* Granular Checkboxes */}
                        <div className="space-y-3.5">
                          <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-1">
                            Granular Access Rights
                          </label>

                          <div className="space-y-3">
                            {[
                              {
                                id: "modify_sales",
                                label: "Modify Sales History",
                                desc: "Process invoice returns, refunds, and manually delete sales/income/expense transactions.",
                              },
                              {
                                id: "view_purchase_prices",
                                label: "View Purchase Prices",
                                desc: "Access product cost/buying price listings and inputs.",
                              },
                              {
                                id: "edit_products",
                                label: "Edit Product Registry",
                                desc: "Create new products, update selling/buying rates, upload spreadsheets, and delete catalogs.",
                              },
                            ].map((perm) => {
                              const checked = editPermissions.includes(perm.id);
                              return (
                                <div
                                  key={perm.id}
                                  onClick={() => handleTogglePermission(perm.id)}
                                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                                    checked
                                      ? "bg-indigo-500/5 border-indigo-500/30"
                                      : "bg-bg-card border-border-color hover:border-text-secondary/25"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {}} // handled by div click
                                    className="mt-0.5 rounded border-border-color text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-text-main">{perm.label}</p>
                                    <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">{perm.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={savingPermissions}
                            className="w-full bg-indigo-600 hover:bg-indigo-550 disabled:bg-indigo-600/50 text-white py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-lg shadow-indigo-600/10"
                          >
                            {savingPermissions ? "Saving settings..." : "Save Role & Permissions"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Audit Logs Panel */
            <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text-main tracking-tight flex items-center gap-2">
                    <FaShieldAlt className="text-indigo-500 text-sm" /> Action Audit Log
                  </h2>
                  <p className="text-text-secondary text-xs mt-1">
                    Trace modifications, stock adjustments, invoice returns, and manual deletions.
                  </p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  disabled={loadingAudit}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  {loadingAudit ? "Refreshing..." : "Refresh Logs"}
                </button>
              </div>

              {loadingAudit ? (
                <div className="space-y-3 py-6">
                  <div className="h-6 bg-border-color/20 animate-pulse rounded" />
                  <div className="h-20 bg-border-color/10 animate-pulse rounded" />
                  <div className="h-20 bg-border-color/10 animate-pulse rounded" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-sm">
                  No audit log entries recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-color text-text-secondary font-semibold">
                        <th className="py-3 pr-4 uppercase tracking-wider">User</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Action</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Target</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">Details</th>
                        <th className="py-3 pr-4 uppercase tracking-wider">IP / Client</th>
                        <th className="py-3 uppercase tracking-wider text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/50">
                      {auditLogs.map((log) => {
                        let actionColor = "bg-slate-500/10 text-slate-500 border border-slate-500/10";
                        if (log.action === "create") actionColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15";
                        if (log.action === "delete") actionColor = "bg-rose-500/10 text-rose-500 border border-rose-500/15";
                        if (log.action === "update") actionColor = "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15";
                        if (log.action === "status_change") actionColor = "bg-amber-500/10 text-amber-500 border border-amber-500/15";

                        return (
                          <tr key={log._id} className="hover:bg-bg-main/40 transition-colors">
                            <td className="py-3.5 pr-4 font-semibold text-text-main">
                              <div>{log.userName}</div>
                              <div className="text-[10px] text-text-secondary font-normal uppercase mt-0.5 tracking-wider">{log.userRole}</div>
                            </td>
                            <td className="py-3.5 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${actionColor}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3.5 pr-4">
                              <div className="font-semibold text-text-main">{log.entity}</div>
                              {log.entityId && (
                                <div className="text-[9px] text-text-secondary font-mono mt-0.5">#{log.entityId.toString().slice(-6).toUpperCase()}</div>
                              )}
                            </td>
                            <td className="py-3.5 pr-4 text-text-secondary max-w-xs break-words">
                              {log.description}
                            </td>
                            <td className="py-3.5 pr-4 text-text-secondary text-[10px] font-mono">
                              <div>{log.ipAddress || "Unknown"}</div>
                              <div className="text-[9px] truncate max-w-[120px] mt-0.5 text-text-secondary/60" title={log.userAgent}>{log.userAgent || "—"}</div>
                            </td>
                            <td className="py-3.5 text-right text-text-secondary">
                              <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] mt-0.5 text-text-secondary/70">{new Date(log.createdAt).toLocaleTimeString()}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// Reusable Local Input
const Input = ({ label, name, type = "text", value, onChange, placeholder, required = true, disabled = false }) => {
  return (
    <div>
      <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
};

export default Settings;
