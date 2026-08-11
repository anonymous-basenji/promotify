import { useState, useMemo } from "react";
import { 
  Share2, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Undo
} from "lucide-react";
import { usePromotifyData } from "~/hooks/usePromotifyData";
import type { DayOfWeek, FacebookGroup, ViewFilter } from "~/types/promotify";
import { DAYS_OF_WEEK } from "~/types/promotify";

export default function Index() {
  const {
    groups,
    promoText,
    isLoaded,
    savePromoText,
    addGroup,
    updateGroup,
    deleteGroup,
    markGroupPosted,
    unmarkGroupPosted,
    resetToDefault
  } = usePromotifyData();

  // Determine current day of week
  const todayDayName = useMemo<DayOfWeek>(() => {
    const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    return DAYS_OF_WEEK[dayIndex];
  }, []);

  const [selectedFilter, setSelectedFilter] = useState<ViewFilter>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modal state for Add / Edit
  const [editingGroup, setEditingGroup] = useState<FacebookGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form fields state
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDays, setFormDays] = useState<Record<DayOfWeek, boolean>>({
    Sunday: true,
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true
  });

  // Effective day for filtering
  const activeDayName: DayOfWeek = selectedFilter === "today" ? todayDayName : (selectedFilter === "all" ? todayDayName : selectedFilter);

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Copy Promo Post Text to Clipboard
  const handleCopyPromoText = () => {
    if (!promoText) return;
    navigator.clipboard.writeText(promoText);
    triggerToast("Promo text copied to clipboard! 📋");
  };

  // Open modal for new group
  const handleOpenAddModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormNotes("");
    setFormDays({
      Sunday: true,
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true
    });
    setIsModalOpen(true);
  };

  // Open modal for editing group
  const handleOpenEditModal = (group: FacebookGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormNotes(group.notes || "");
    setFormDays({ ...group.days });
    setIsModalOpen(true);
  };

  // Save Group (Add or Update)
  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingGroup) {
      updateGroup({
        ...editingGroup,
        name: formName.trim(),
        notes: formNotes.trim(),
        days: formDays
      });
      triggerToast("Group schedule updated! ✨");
    } else {
      addGroup({
        name: formName.trim(),
        notes: formNotes.trim(),
        days: formDays
      });
      triggerToast("New group added! 🎉");
    }
    setIsModalOpen(false);
  };

  // Filter & sort groups for selected tab
  const filteredGroups = useMemo(() => {
    return groups
      .filter((g) => {
        // Filter by Search Query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = g.name.toLowerCase().includes(query);
          const matchNotes = g.notes?.toLowerCase().includes(query) || false;
          if (!matchName && !matchNotes) return false;
        }

        // Filter by Day
        if (selectedFilter === "all") return true;
        
        const dayToCheck: DayOfWeek = selectedFilter === "today" ? todayDayName : selectedFilter;
        return g.days[dayToCheck];
      })
      .sort((a, b) => {
        // Put groups with specific day rules / notes at top so tab changes are immediately noticeable
        const aHasNotes = a.notes ? 1 : 0;
        const bHasNotes = b.notes ? 1 : 0;
        if (bHasNotes !== aHasNotes) return bHasNotes - aHasNotes;
        
        // Count how many total days allowed (fewer days = more restrictive = higher priority)
        const aDaysCount = Object.values(a.days).filter(Boolean).length;
        const bDaysCount = Object.values(b.days).filter(Boolean).length;
        return aDaysCount - bDaysCount;
      });
  }, [groups, searchQuery, selectedFilter, todayDayName]);

  // Active day group count
  const todayActiveCount = useMemo(() => {
    const checkDay = selectedFilter === "today" ? todayDayName : (selectedFilter === "all" ? todayDayName : selectedFilter);
    return groups.filter((g) => g.days[checkDay]).length;
  }, [groups, selectedFilter, todayDayName]);

  if (!isLoaded) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading Promotify...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Header */}
      <header className="header-bar">
        <div className="brand">
          <div className="brand-icon">
            <Share2 size={24} />
          </div>
          <div>
            <h1 className="brand-title">Promotify</h1>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="btn-icon" 
            title="Reset to Original CSV Schedule" 
            onClick={() => {
              if (confirm("Reset all groups and promo text back to default seed CSV schedule?")) {
                resetToDefault();
                triggerToast("Schedule reset to default CSV! 🔄");
              }
            }}
          >
            <RotateCcw size={18} />
          </button>
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Group</span>
          </button>
        </div>
      </header>

      {/* Daily Banner Status */}
      <section className="stats-banner">
        <div className="stats-info">
          <h2>
            <Calendar size={20} style={{ color: "var(--accent-primary)" }} />
            {selectedFilter === "today" 
              ? `Today is ${todayDayName}` 
              : selectedFilter === "all" 
              ? "All Facebook Groups" 
              : `${selectedFilter} Schedule`}
          </h2>
          <p>
            {selectedFilter === "all" 
              ? `Showing total ${groups.length} Facebook groups in dataset`
              : `Showing ${filteredGroups.length} groups open for posting on ${activeDayName}`
            }
          </p>
        </div>
        <div className="stats-badge">
          {filteredGroups.length} Groups
        </div>
      </section>

      {/* Saved Promo Post Text Box */}
      <section className="promo-card">
        <div className="promo-header">
          <h2 className="promo-title">
            <Sparkles size={18} style={{ color: "var(--accent-amber)" }} />
            Saved Promotion Post Text
          </h2>
          <span className="char-count">{promoText.length} characters</span>
        </div>
        <textarea
          className="promo-textarea"
          value={promoText}
          onChange={(e) => savePromoText(e.target.value)}
          placeholder="Paste or write your promotional post text here..."
        />
        <div className="promo-footer">
          <span className="char-count" style={{ fontSize: "0.775rem" }}>Auto-saved to device</span>
          <button className="btn-primary" onClick={handleCopyPromoText}>
            <Copy size={16} />
            <span>Copy Post Text</span>
          </button>
        </div>
      </section>

      {/* Day Filter Tabs */}
      <nav className="day-selector-container">
        <button
          className={`day-tab ${selectedFilter === "today" ? "active" : ""}`}
          onClick={() => setSelectedFilter("today")}
        >
          <span className="today-dot" />
          Today ({todayDayName.slice(0, 3)})
        </button>

        {DAYS_OF_WEEK.map((day) => (
          <button
            key={day}
            className={`day-tab ${selectedFilter === day ? "active" : ""}`}
            onClick={() => setSelectedFilter(day)}
          >
            {day}
          </button>
        ))}

        <button
          className={`day-tab ${selectedFilter === "all" ? "active" : ""}`}
          onClick={() => setSelectedFilter("all")}
        >
          All Groups ({groups.length})
        </button>
      </nav>

      {/* Search Input Bar */}
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search Facebook groups by name or rule..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Facebook Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
          <AlertCircle size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
          <p>No Facebook groups match your filter for {selectedFilter === "today" ? todayDayName : selectedFilter}.</p>
        </div>
      ) : (
        <main className="groups-grid">
          {filteredGroups.map((group) => {
            const isAllowedToday = group.days[todayDayName];
            const isAllowedActiveDay = group.days[activeDayName];

            return (
              <article 
                key={group.id} 
                className={`group-card ${!isAllowedActiveDay ? "inactive-today" : ""}`}
              >
                <div className="group-card-header">
                  <h3 className="group-name">{group.name}</h3>
                  <button 
                    className="btn-icon" 
                    style={{ padding: "6px" }}
                    onClick={() => handleOpenEditModal(group)}
                    title="Edit group schedule"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>

                {group.notes && (
                  <div className="group-notes">
                    <Clock size={13} />
                    <span>{group.notes}</span>
                  </div>
                )}

                {/* Day badges - highlights all allowed days for this group */}
                <div className="days-chips">
                  {DAYS_OF_WEEK.map((d) => {
                    const isDayActive = group.days[d];
                    return (
                      <span 
                        key={d} 
                        className={`day-chip ${isDayActive ? "active" : ""}`}
                        title={`${d}: ${isDayActive ? "Allowed" : "Not Allowed"}`}
                      >
                        {d[0]}
                      </span>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="card-actions">
                  {group.lastPostedDate ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="posted-tag">
                        <Check size={12} /> Posted {group.lastPostedDate}
                      </span>
                      <button
                        className="btn-small-action"
                        style={{ color: "var(--accent-amber)", borderColor: "rgba(245, 158, 11, 0.3)" }}
                        onClick={() => {
                          unmarkGroupPosted(group.id);
                          triggerToast(`Untracked post for "${group.name}" ↩️`);
                        }}
                        title="Untrack post date"
                      >
                        <Undo size={12} />
                        <span>Untrack</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: isAllowedActiveDay ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                      {isAllowedActiveDay ? `Open on ${activeDayName}` : `Closed on ${activeDayName}`}
                    </span>
                  )}

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn-small-action"
                      onClick={() => {
                        handleCopyPromoText();
                        markGroupPosted(group.id);
                        triggerToast(`Copied & tracked post for "${group.name}"! 📌`);
                      }}
                      title="Copy text & mark group as posted today"
                    >
                      <Copy size={13} />
                      <span>{group.lastPostedDate ? "Re-copy Text" : "Copy & Track"}</span>
                    </button>
                    <a
                      href={`https://www.facebook.com/search/groups/?q=${encodeURIComponent(group.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-small-action"
                      title="Open Facebook group search"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </main>
      )}

      {/* Add / Edit Group Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGroup ? "Edit Facebook Group" : "Add Facebook Group"}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Orlando Business Connect"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Posting Notes / Frequency Rules</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. One post every 7 days max"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allowed Days of Week</label>
                <div className="days-picker">
                  {DAYS_OF_WEEK.map((d) => (
                    <div
                      key={d}
                      className={`day-checkbox-item ${formDays[d] ? "checked" : ""}`}
                      onClick={() => setFormDays((prev) => ({ ...prev, [d]: !prev[d] }))}
                    >
                      <input
                        type="checkbox"
                        checked={formDays[d]}
                        onChange={() => {}}
                        style={{ pointerEvents: "none" }}
                      />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                {editingGroup ? (
                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: "var(--accent-rose)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}
                    onClick={() => {
                      if (confirm(`Delete group "${editingGroup.name}"?`)) {
                        deleteGroup(editingGroup.id);
                        setIsModalOpen(false);
                        triggerToast("Group deleted! 🗑️");
                      }
                    }}
                  >
                    <Trash2 size={15} /> Delete Group
                  </button>
                ) : <div />}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Group
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
