import { useEffect, useState } from "react";
import { FaUser, FaLock, FaEnvelope, FaPhone, FaSave, FaShieldAlt, FaUserPlus, FaChevronDown, FaChevronUp, FaEye, FaEyeSlash } from "react-icons/fa";
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
  const [theme, setTheme] = useState(localStorage.getItem("smartstore_theme_color") || "indigo");

  // RBAC User Permission management states & handlers
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editPermissions, setEditPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Create New User states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
  });

  const handleNewUserChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUserData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setCreatingUser(true);
    try {
      await API.post("/auth/register", newUserData);
      toast.success(`${newUserData.role.charAt(0).toUpperCase() + newUserData.role.slice(1)} account created successfully!`);
      setNewUserData({ name: "", email: "", password: "", role: "cashier" });
      setShowCreateUser(false);
      fetchUsers(); // refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

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

  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem("smartstore_theme_color", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
    toast.success(`Color theme updated to ${selectedTheme}`);
  };

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
          <div className="flex border-b border-border-color/60 gap-6 mb-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-text-secondary hover:text-text-main"
              }`}
            >
              Profile & Security
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === "appearance"
                  ? "border-indigo-500 text-indigo-500"
                  : "border-transparent text-text-secondary hover:text-text-main"
              }`}
            >
              Appearance & Theme
            </button>
            {(profileData.role === "admin" || profileData.role === "manager") && (
              <button
                onClick={() => setActiveTab("users")}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === "users"
                    ? "border-indigo-500 text-indigo-500"
                    : "border-transparent text-text-secondary hover:text-text-main"
                }`}
              >
                Users & RBAC Settings
              </button>
            )}
          </div>

          {activeTab === "appearance" && (
            <div className="space-y-8">
              <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-text-main mb-1 tracking-tight flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">🎨</span>
                  Color Theme Selection
                </h2>
                <p className="text-text-secondary text-xs mb-6">Personalize your dashboard experience with a custom primary color.</p>
                
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {[
                    { id: "indigo", name: "Indigo", colorClass: "bg-[#4f46e5]" },
                    { id: "emerald", name: "Emerald", colorClass: "bg-[#10b981]" },
                    { id: "rose", name: "Rose", colorClass: "bg-[#f43f5e]" },
                    { id: "amber", name: "Amber", colorClass: "bg-[#f59e0b]" },
                    { id: "purple", name: "Purple", colorClass: "bg-[#8b5cf6]" },
                    { id: "cyan", name: "Cyan", colorClass: "bg-[#06b6d4]" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                        theme === t.id 
                          ? "border-indigo-500 bg-indigo-500/5 shadow-md scale-105" 
                          : "border-border-color hover:border-indigo-500/50 hover:bg-bg-main"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full shadow-inner ${t.colorClass} ${theme === t.id ? "ring-2 ring-offset-2 ring-offset-bg-card ring-indigo-500" : ""}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === t.id ? "text-indigo-600" : "text-text-secondary"}`}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
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
          )}

          {activeTab === "users" && (profileData.role === "admin" || profileData.role === "manager") && (        /* Users & RBAC Settings Panel */
            <div className="space-y-6">
              {/* Create New User Card */}
              <div className="bg-bg-card border border-border-color rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-bg-main/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FaUserPlus className="text-emerald-500 text-sm" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-text-main">Create New Staff Account</h3>
                      <p className="text-[11px] text-text-secondary mt-0.5">Register a new cashier or manager for the store</p>
                    </div>
                  </div>
                  {showCreateUser ? (
                    <FaChevronUp className="text-text-secondary text-xs" />
                  ) : (
                    <FaChevronDown className="text-text-secondary text-xs" />
                  )}
                </button>

                {showCreateUser && (
                  <div className="px-5 pb-5 border-t border-border-color/50">
                    <form onSubmit={handleCreateUser} className="pt-5 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                          label="Full Name"
                          name="name"
                          value={newUserData.name}
                          onChange={handleNewUserChange}
                          placeholder="Staff member name"
                        />
                        <Input
                          label="Email Address"
                          name="email"
                          type="email"
                          value={newUserData.email}
                          onChange={handleNewUserChange}
                          placeholder="staff@store.com"
                        />
                        <div>
                          <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Password</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              name="password"
                              value={newUserData.password}
                              onChange={handleNewUserChange}
                              required
                              placeholder="Minimum 6 characters"
                              className="w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-2.5 pr-11 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main transition-colors cursor-pointer"
                            >
                              {showNewPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Role</label>
                          <select
                            name="role"
                            value={newUserData.role}
                            onChange={handleNewUserChange}
                            className="w-full border border-border-color bg-bg-main text-text-main px-4 py-2.5 rounded-xl outline-none text-sm cursor-pointer focus:border-indigo-500 transition-all"
                          >
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                      </div>

                      {/* Role info hint */}
                      <div className={`rounded-xl border p-3.5 text-[11px] leading-relaxed ${
                        newUserData.role === "manager"
                          ? "bg-amber-500/5 border-amber-500/15 text-amber-500/90"
                          : "bg-blue-500/5 border-blue-500/15 text-blue-500/90"
                      }`}>
                        {newUserData.role === "manager" ? (
                          <><strong>Manager</strong> — Gets full permissions by default: modify sales history, view purchase prices, and edit product registry. You can customise these after creation.</>
                        ) : (
                          <><strong>Cashier</strong> — Gets minimal permissions by default: view purchase prices only. They can access POS billing and sales history. Permissions can be expanded later.</>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={creatingUser}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-lg shadow-emerald-600/10"
                        >
                          <FaUserPlus className="text-xs" />
                          {creatingUser ? "Creating Account..." : "Create Staff Account"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

            {/* Existing Users Table */}
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
            </div>
          )}

          {activeTab === "audit" && (
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
                        if (log.action === "login") actionColor = "bg-cyan-500/10 text-cyan-500 border border-cyan-500/15";

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
