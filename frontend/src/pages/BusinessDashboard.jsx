import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./SupplierDashboard.css";
import { chatApi, orderApi, profileApi, request } from "../api/client.js";
import { getCurrentUser, logout } from "../lib/session.js";
import { idValue, mergeConversations, mergeMessages } from "../lib/chat.js";
import Avatar from "../components/Avatar.jsx";
import ProductImageCarousel from "../components/ProductImageCarousel.jsx";
import OrderModal from "../components/OrderModal.jsx";
import ProfilePictureUpload from "../components/ProfilePictureUpload.jsx";
import {
  GridIcon,
  ShoppingBagIcon,
  MessageSquareIcon,
  BellIcon,
  MenuIcon,
  UserIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  VerifiedBadgeIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  SendIcon,
  DoubleCheckIcon,
  EditIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  LogOutIcon,
  PackageIcon,
} from "../components/Icons.jsx";

const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

function formatMessageTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function BusinessDashboard() {
  const [user, setUser] = useState(() => getCurrentUser() || {});
  const displayName = user.name || user.fullName || "Business";
  const [activeView, setActiveView] = useState("Find Suppliers");
  const [search, setSearch] = useState("");
  const [town, setTown] = useState("All towns");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [detailSupplier, setDetailSupplier] = useState(null);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [orderModalSupplier, setOrderModalSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ordersCount, setOrdersCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const towns = ["All towns", ...new Set(suppliers.map((supplier) => supplier.town).filter(Boolean))];
  const products = suppliers.flatMap((supplier) =>
    supplier.products.map((product) => ({
      ...product,
      supplier: supplier.name,
      supplierId: supplier._id,
      supplierObj: supplier,
    }))
  );

  useEffect(() => {
    const handleStorage = () => setUser(getCurrentUser() || {});
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (town !== "All towns") params.set("town", town);
    request(`/api/suppliers?${params}`)
      .then((data) => {
        if (!cancelled) {
          setSuppliers(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, town]);

  function selectSupplier(supplier) {
    setDetailSupplier(supplier);
    setActiveView("Supplier Details");
  }

  function handleOpenOrder(product, supplierObj) {
    setSelectedProductForOrder(product);
    setOrderModalSupplier(
      supplierObj || detailSupplier || suppliers.find((s) => s._id === product.supplierId)
    );
  }

  return (
    <main className={`dashboard-shell ${darkMode ? "dark-mode" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" type="button" />
      <aside className="dashboard-sidebar">
        <button className="mobile-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" type="button">
          <XIcon size={18} />
        </button>
        <a href="/" className="dashboard-brand">
          <span className="brand-mark">CD</span>
          <span>Chain Daan</span>
        </a>
        <div
          className="supplier-mini"
          onClick={() => setActiveView("My Profile")}
          style={{ cursor: "pointer" }}
          title="Click to view/edit profile"
        >
          <Avatar user={user} />
          <div>
            <b>{displayName}</b>
            <span>Business account</span>
          </div>
          <span className="online-dot" />
        </div>
        <nav className="dashboard-nav" aria-label="Business dashboard navigation">
          {["Find Suppliers", "Products", "My Orders", "Messages", "My Profile"].map((view) => (
            <button
              key={view}
              className={activeView === view ? "active" : ""}
              onClick={() => { setActiveView(view); setSidebarOpen(false); }}
              type="button"
            >
              <span className="dashboard-icon">
                {view === "Find Suppliers" && <SearchIcon size={17} />}
                {view === "Products" && <GridIcon size={17} />}
                {view === "My Orders" && <ShoppingBagIcon size={17} />}
                {view === "Messages" && <MessageSquareIcon size={17} />}
                {view === "My Profile" && <UserIcon size={17} />}
              </span>
              {view}
              {view === "My Orders" && ordersCount > 0 && <em>{ordersCount}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={logout} className="logout-link" type="button">
            <span className="dashboard-icon"><LogOutIcon size={17} /></span>Log out
          </button>
        </div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" type="button">
            <MenuIcon size={19} />
          </button>
          <div>
            <p className="dashboard-kicker">BUSINESS WORKSPACE</p>
            <h1>{activeView}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Notifications" onClick={() => setNotificationsOpen((current) => !current)}>
              <BellIcon size={18} />
              {ordersCount > 0 && <b>{ordersCount}</b>}
            </button>
            {notificationsOpen && (
              <div className="notification-panel" role="status">
                <strong>Notifications</strong>
                {ordersCount > 0 ? <button type="button" onClick={() => { setActiveView("My Orders"); setNotificationsOpen(false); }}><ShoppingBagIcon size={15} /> View your {ordersCount} order{ordersCount === 1 ? "" : "s"}</button> : <span>No new notifications.</span>}
              </div>
            )}
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((current) => !current)}
              type="button"
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <div
              className="topbar-user"
              onClick={() => setActiveView("My Profile")}
              style={{ cursor: "pointer" }}
              title="View profile"
            >
              <Avatar user={user} size="small" />
              <span>{displayName}</span>
              <VerifiedBadgeIcon size={14} />
            </div>
          </div>
        </header>

        {activeView === "Find Suppliers" && (
          <SupplierDirectory
            suppliers={suppliers}
            towns={towns}
            town={town}
            setTown={setTown}
            search={search}
            setSearch={setSearch}
            loading={loading}
            error={error}
            onSelect={selectSupplier}
          />
        )}
        {activeView === "Products" && (
          <ProductDirectory
            products={products}
            search={search}
            setSearch={setSearch}
            onSelect={(product) =>
              selectSupplier(suppliers.find((supplier) => supplier._id === product.supplierId))
            }
            onOrder={(product) => handleOpenOrder(product, product.supplierObj)}
          />
        )}
        {activeView === "Supplier Details" && (
          <SupplierDetail
            supplier={detailSupplier}
            onMessage={() => {
              setSelectedSupplier(detailSupplier);
              setActiveView("Messages");
            }}
            onOrder={(product) => handleOpenOrder(product, detailSupplier)}
          />
        )}
        {activeView === "My Orders" && (
          <BusinessOrders
            currentUser={user}
            onOrdersCountChange={setOrdersCount}
            onMessageSupplier={(supplierObj) => {
              setSelectedSupplier(supplierObj);
              setActiveView("Messages");
            }}
          />
        )}
        {activeView === "Messages" && (
          <BusinessMessages
            supplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            currentUser={user}
          />
        )}
        {activeView === "My Profile" && (
          <BusinessProfile
            key={user?._id || "business-profile"}
            user={user}
            onUserUpdated={setUser}
            profileSaved={profileSaved}
            setProfileSaved={setProfileSaved}
          />
        )}
      </section>

      {/* Inquire & Order Modal */}
      {selectedProductForOrder && (
        <OrderModal
          product={selectedProductForOrder}
          supplier={orderModalSupplier}
          currentUser={user}
          onClose={() => {
            setSelectedProductForOrder(null);
            setOrderModalSupplier(null);
          }}
          onOrderPlaced={() => {
            // Update orders count or notify
          }}
        />
      )}
    </main>
  );
}

function SupplierDetail({ supplier, onMessage, onOrder }) {
  if (!supplier)
    return (
      <div className="empty-state">
        <h3>Supplier not found</h3>
        <p>Return to Find Suppliers and choose a supplier.</p>
      </div>
    );
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="dashboard-kicker">SUPPLIER PROFILE</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ margin: 0 }}>{supplier.name}</h2>
            <VerifiedBadgeIcon size={20} />
          </div>
          <p style={{ marginTop: "4px" }}>
            {supplier.town || "Location not provided"} · {supplier.about || "Local supplier"}
          </p>
        </div>
        <button className="primary-action" onClick={onMessage} type="button">
          <MessageSquareIcon size={15} style={{ marginRight: 6 }} /> Message supplier
        </button>
      </div>
      <section className="dashboard-card supplier-detail-card">
        <div className="supplier-detail-head">
          <Avatar user={supplier} size="large" />
          <div className="supplier-detail-info">
            <div className="supplier-detail-title">
              <h3>{supplier.name}</h3>
              <VerifiedBadgeIcon size={18} />
              {supplier.category && <span className="category-pill">{supplier.category}</span>}
            </div>
            {supplier.fullName && (
              <p className="supplier-contact-name" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <UserIcon size={14} /> Contact Person: <strong>{supplier.fullName}</strong>
              </p>
            )}
            <p className="supplier-detail-meta" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span><MapPinIcon size={13} /> {supplier.town || "Ilocos Norte"}</span>
              {supplier.phone && <span><PhoneIcon size={13} /> {supplier.phone}</span>}
              {supplier.email && <span><MailIcon size={13} /> {supplier.email}</span>}
            </p>
          </div>
        </div>

        {(supplier.about || supplier.deliveryInfo || supplier.businessHours || supplier.minimumOrder) && (
          <div className="supplier-detail-body">
            {supplier.about && (
              <div className="supplier-info-block">
                <h4>About the Supplier</h4>
                <p>{supplier.about}</p>
              </div>
            )}
            <div className="supplier-info-grid">
              {supplier.businessHours && (
                <div className="info-chip">
                  <span className="info-icon"><ClockIcon size={18} /></span>
                  <div>
                    <strong>Business Hours</strong>
                    <span>{supplier.businessHours}</span>
                  </div>
                </div>
              )}
              {supplier.deliveryInfo && (
                <div className="info-chip">
                  <span className="info-icon"><TruckIcon size={18} /></span>
                  <div>
                    <strong>Delivery Terms</strong>
                    <span>{supplier.deliveryInfo}</span>
                  </div>
                </div>
              )}
              {supplier.minimumOrder && (
                <div className="info-chip">
                  <span className="info-icon"><PackageIcon size={18} /></span>
                  <div>
                    <strong>Minimum Order</strong>
                    <span>{supplier.minimumOrder}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="supplier-products-section">
          <div className="products-section-header">
            <h4>Available Products ({supplier.products.length})</h4>
            <p>Browse listings or order directly from this verified supplier.</p>
          </div>
          <div className="supplier-detail-products">
            {supplier.products.map((product) => (
              <article className="supplier-detail-product" key={product._id}>
                <ProductImageCarousel images={product.images} alt={product.name} />
                <h3>{product.name}</h3>
                <p>
                  {product.category || "Product"} · {product.stock} in stock
                </p>
                <strong>₱{Number(product.price || 0).toLocaleString()}</strong>
                <div className="product-card-actions">
                  <button
                    className="btn-order-now"
                    onClick={() => onOrder(product)}
                    type="button"
                  >
                    <ShoppingBagIcon size={14} style={{ marginRight: 5 }} /> Inquire / Order
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SupplierDirectory({
  suppliers,
  towns,
  town,
  setTown,
  search,
  setSearch,
  loading,
  error,
  onSelect,
}) {
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="dashboard-kicker">LOCAL MARKETPLACE</p>
          <h2>Find trusted suppliers</h2>
          <p>Search real supplier accounts, products, categories, and municipalities.</p>
        </div>
      </div>
      <div className="directory-toolbar">
        <label className="directory-search">
          <SearchIcon size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers or products"
            aria-label="Search suppliers or products"
          />
        </label>
        <select
          value={town}
          onChange={(event) => setTown(event.target.value)}
          aria-label="Filter suppliers by town"
        >
          {towns.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      {error && (
        <div className="empty-state">
          <h3>Could not load suppliers</h3>
          <p>{error}</p>
        </div>
      )}
      {loading && (
        <div className="empty-state">
          <p>Loading suppliers...</p>
        </div>
      )}
      {!loading && !error && (
        <div className="supplier-grid">
          {suppliers.map((supplier) => (
            <article className="supplier-card" key={supplier._id}>
              <div className="supplier-card-head">
                <Avatar user={supplier} color="blue" size="chat" />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <h3>{supplier.name}</h3>
                    <VerifiedBadgeIcon size={15} />
                  </div>
                  <span>
                    {supplier.town || "Location not provided"}
                    {supplier.category ? ` · ${supplier.category}` : ""}
                  </span>
                </div>
              </div>
              <p>{supplier.about || "Local supplier ready to connect with businesses."}</p>
              {(supplier.minimumOrder || supplier.deliveryInfo) && (
                <div className="supplier-meta-tags">
                  {supplier.minimumOrder && (
                    <span className="meta-tag min-order">
                      <PackageIcon size={12} /> Min. {supplier.minimumOrder}
                    </span>
                  )}
                  {supplier.deliveryInfo && (
                    <span className="meta-tag delivery">
                      <TruckIcon size={12} /> {supplier.deliveryInfo}
                    </span>
                  )}
                </div>
              )}
              <div className="supplier-products">
                {supplier.products.map((product) => (
                  <span key={product._id}>{product.name}</span>
                ))}
              </div>
              <button
                className="contact-button"
                onClick={() => onSelect(supplier)}
                type="button"
              >
                View Supplier Store →
              </button>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && suppliers.length === 0 && (
        <div className="empty-state">
          <h3>No suppliers found</h3>
          <p>Try another supplier, product, category, or town.</p>
        </div>
      )}
    </div>
  );
}

function ProductDirectory({ products, search, setSearch, onSelect, onOrder }) {
  const visibleProducts = products.filter((product) =>
    [product.name, product.category || "", product.supplier].some((value) =>
      value.toLowerCase().includes(search.toLowerCase())
    )
  );
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <h2>Browse products</h2>
          <p>Find quality products from verified local suppliers across Ilocos Norte.</p>
        </div>
      </div>
      <div className="directory-toolbar">
        <label className="directory-search">
          <SearchIcon size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products or suppliers"
            aria-label="Search products or suppliers"
          />
        </label>
      </div>
      <div className="supplier-grid">
        {visibleProducts.map((product) => (
          <article className="supplier-card" key={product._id}>
            <p className="dashboard-kicker">{product.category || "Product"}</p>
            <h3>{product.name}</h3>
            <p>
              By <strong>{product.supplier}</strong>
            </p>
            <strong className="business-price">₱{Number(product.price || 0).toLocaleString()}</strong>
            <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
              <button
                className="contact-button"
                onClick={() => onSelect(product)}
                type="button"
                style={{ flex: 1 }}
              >
                View Store
              </button>
              <button
                className="primary-action"
                onClick={() => onOrder(product)}
                type="button"
                style={{ minHeight: "35px", fontSize: "11px", padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <ShoppingBagIcon size={14} /> Order
              </button>
            </div>
          </article>
        ))}
      </div>
      {visibleProducts.length === 0 && (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try another search.</p>
        </div>
      )}
    </div>
  );
}

function BusinessOrders({ currentUser, onOrdersCountChange, onMessageSupplier }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    orderApi
      .list()
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
          if (onOrdersCountChange) onOrdersCountChange(data.length);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socket.on("orderUpdated", (updatedOrder) => {
      setOrders((current) =>
        current.map((item) => (item._id === updatedOrder._id ? updatedOrder : item))
      );
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [currentUser._id, onOrdersCountChange]);

  async function cancelOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this order inquiry?")) return;
    try {
      const updated = await orderApi.updateStatus(orderId, "cancelled");
      setOrders((current) => current.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      alert(err.message || "Failed to cancel order.");
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <h2>My Inquiries & Orders</h2>
          <p>Track order confirmations, approval status, and delivery progress from suppliers.</p>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="orders-filter-pills">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
            <button
              key={st}
              className={filter === st ? "active" : ""}
              onClick={() => setFilter(st)}
              type="button"
            >
              {st === "all"
                ? `All (${orders.length})`
                : st === "pending"
                ? `Pending (${orders.filter((o) => o.status === "pending").length})`
                : st === "confirmed"
                ? `Approved (${orders.filter((o) => o.status === "confirmed").length})`
                : st === "completed"
                ? `Delivered (${orders.filter((o) => o.status === "completed").length})`
                : `Cancelled (${orders.filter((o) => o.status === "cancelled").length})`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="empty-state">
          <h3>Could not load orders</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <p>Loading your orders...</p>
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="empty-state">
          <h3>No {filter === "all" ? "" : filter} orders found</h3>
          <p>Browse suppliers and products to place your first wholesale or local order.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const supplier = order.supplierId || {};
            const product = order.productId || {};
            return (
              <div className="order-card" key={order._id}>
                <div className="order-card-head">
                  <div className="order-card-buyer">
                    <Avatar user={supplier} color="blue" size="chat" />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <h4 className="order-buyer-name">{supplier.name || "Supplier"}</h4>
                        <VerifiedBadgeIcon size={15} />
                      </div>
                      <p className="order-buyer-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span><MapPinIcon size={12} /> {order.deliveryTown || supplier.town || "Ilocos Norte"}</span>
                        {supplier.phone && <span><PhoneIcon size={12} /> {supplier.phone}</span>}
                      </p>
                    </div>
                  </div>

                  <div>
                    {order.status === "pending" && (
                      <span className="order-status-badge pending">
                        <ClockIcon size={12} /> Awaiting Confirmation
                      </span>
                    )}
                    {order.status === "confirmed" && (
                      <span className="order-status-badge confirmed">
                        <CheckIcon size={12} /> Approved (Preparing)
                      </span>
                    )}
                    {order.status === "completed" && (
                      <span className="order-status-badge completed">
                        <PackageIcon size={12} /> Delivered
                      </span>
                    )}
                    {order.status === "cancelled" && (
                      <span className="order-status-badge cancelled">
                        <XIcon size={12} /> Cancelled
                      </span>
                    )}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-product-info">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="order-prod-img"
                      />
                    ) : (
                      <div className="snapshot-placeholder" style={{ width: 60, height: 60 }}>
                        <PackageIcon size={24} />
                      </div>
                    )}
                    <div className="order-prod-details">
                      <h4>{product.name || "Product"}</h4>
                      <p>
                        ₱{Number(product.price || 0).toLocaleString()} × {order.quantity} units
                      </p>
                      <strong>Total: ₱{Number(order.total || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="order-delivery-info">
                    <div>
                      <b>Delivery:</b> {order.deliveryAddress}, {order.deliveryTown}
                    </div>
                    <div>
                      <b>Payment:</b> {order.paymentMethod || "Cash on Delivery (COD)"}
                    </div>
                    {order.notes && (
                      <div>
                        <b>Notes:</b> &quot;{order.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-card-foot">
                  <span className="order-date-note">
                    Ordered on {new Date(order.createdAt || order.soldAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt || order.soldAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <div className="order-action-btns">
                    {order.status === "pending" && (
                      <button
                        className="btn-action decline"
                        onClick={() => cancelOrder(order._id)}
                        type="button"
                      >
                        Cancel Inquiry
                      </button>
                    )}
                    <button
                      className="btn-action chat"
                      onClick={() => onMessageSupplier(supplier)}
                      type="button"
                    >
                      <MessageSquareIcon size={14} style={{ marginRight: 4 }} /> Message Supplier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BusinessMessages({ supplier, setSelectedSupplier, currentUser = getCurrentUser() || {} }) {
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    chatApi
      .conversations()
      .then((data) => setConversations((current) => mergeConversations(current, data, currentUser._id)))
      .catch((requestError) => setError(requestError.message));
  }, [currentUser._id]);

  useEffect(() => {
    if (!supplier?._id) return undefined;
    let cancelled = false;
    chatApi
      .createConversation(supplier._id)
      .then((result) => {
        if (!cancelled) {
          setConversation(result);
          setConversations((current) => mergeConversations(current, result, currentUser._id));
        }
      })
      .catch((requestError) => setError(requestError.message));
    return () => {
      cancelled = true;
    };
  }, [supplier?._id, currentUser._id]);

  useEffect(() => {
    if (!conversation?._id) return undefined;
    let cancelled = false;
    chatApi
      .messages(conversation._id)
      .then((result) => {
        if (!cancelled) setMessages((current) => mergeMessages(current, result));
      })
      .catch((requestError) => setError(requestError.message));

    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socketRef.current = socket;
    socket.on("presence:init", (userIds) => setOnlineUserIds(userIds));
    socket.on("presence:update", ({ userId, online }) => {
      setOnlineUserIds((current) =>
        online
          ? current.includes(userId) ? current : [...current, userId]
          : current.filter((id) => id !== userId)
      );
    });

    socket.on("connect", () => {
      socket.emit("joinConversation", conversation._id);
      socket.emit("markSeen", { conversationId: conversation._id });
    });

    socket.on("message", (incoming) => {
      if (incoming.conversationId === conversation._id) {
        setMessages((current) => mergeMessages(current, incoming));
        socket.emit("markSeen", { conversationId: conversation._id });
      }
    });

    socket.on("userTyping", (data) => {
      if (data.conversationId === conversation._id && data.userId !== currentUser._id) {
        setIsTyping(true);
      }
    });

    socket.on("userStopTyping", (data) => {
      if (data.conversationId === conversation._id && data.userId !== currentUser._id) {
        setIsTyping(false);
      }
    });

    socket.on("messagesSeen", (data) => {
      if (data.conversationId === conversation._id) {
        setMessages((current) =>
          current.map((msg) => ({ ...msg, readAt: msg.readAt || new Date() }))
        );
      }
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [conversation?._id, currentUser._id]);

  function handleInputChange(e) {
    setMessage(e.target.value);
    if (socketRef.current && conversation?._id) {
      socketRef.current.emit("typing", { conversationId: conversation._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && conversation?._id) {
          socketRef.current.emit("stopTyping", { conversationId: conversation._id });
        }
      }, 1500);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!message.trim() || !conversation || !supplier) return;
    if (socketRef.current && conversation?._id) {
      socketRef.current.emit("stopTyping", { conversationId: conversation._id });
    }
    try {
      const sent = await chatApi.sendMessage(conversation._id, supplier._id, message);
      setMessages((current) => mergeMessages(current, sent));
      setMessage("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const otherConversations = conversations.filter((item) =>
    item.participantIds.some(
      (participant) => idValue(participant) !== idValue(currentUser._id) && participant.role === "supplier"
    )
  );

  return (
    <div className="messages-layout">
      <section className="chat-list">
        <div className="messages-heading">
          <div>
            <p className="dashboard-kicker">DIRECT CONTACT</p>
            <h2>Messages</h2>
          </div>
        </div>
        {otherConversations.map((item) => {
              const itemSupplier = item.participantIds.find(
                (participant) => idValue(participant) !== idValue(currentUser._id)
          );
          return (
            <button
              className={`chat-preview ${supplier?._id === itemSupplier?._id ? "selected" : ""}`}
              key={item._id}
              onClick={() => {
                setSelectedSupplier(itemSupplier);
                setConversation(item);
              }}
              type="button"
            >
              <Avatar user={itemSupplier} color="blue" size="chat" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <b>{itemSupplier?.name || "Supplier"}</b>
                  <VerifiedBadgeIcon size={13} />
                </div>
                <span>Open conversation</span>
              </div>
            </button>
          );
        })}
        {otherConversations.length === 0 && (
          <div className="chat-empty-list">
            <MessageSquareIcon size={22} />
            <strong>No conversations yet</strong>
            <span>Start a chat from a supplier profile.</span>
          </div>
        )}
      </section>

      <section className="conversation">
        <header className="conversation-head">
          <Avatar user={supplier} color="blue" size="chat" />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <h3>{supplier?.name || "Select a supplier"}</h3>
              {supplier && <VerifiedBadgeIcon size={16} />}
            </div>
            <span className={onlineUserIds.includes(supplier?._id) ? "presence online" : "presence"}>
              <i /> {onlineUserIds.includes(supplier?._id) ? "Online now" : "Offline"}
            </span>
          </div>
        </header>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="conversation-empty">
              <div className="conversation-empty-icon"><MessageSquareIcon size={22} /></div>
              <strong>{supplier ? "Start the conversation" : "Choose a supplier"}</strong>
              <span>{supplier ? `Send a message to ${supplier.name}.` : "Select a supplier to view messages."}</span>
            </div>
          ) : (
            messages.map((item) => {
              const isMine = item.senderId === currentUser._id;
              const sender = isMine ? currentUser : supplier;
              const isSeen = Boolean(item.readAt);
              return (
                <div className={`message-row ${isMine ? "mine" : "theirs"}`} key={item._id}>
                  {!isMine && <Avatar user={sender} size="small" className="message-avatar" />}
                  <div className={`message-bubble ${isMine ? "mine" : "theirs"}`}>
                    <span className="message-text">{item.text}</span>
                    <div className="message-meta">
                      <span className="message-time">{formatMessageTime(item.createdAt)}</span>
                      {isMine && (
                        <span
                          className={`message-status-icon ${isSeen ? "seen" : "delivered"}`}
                          title={isSeen ? "Seen" : "Delivered"}
                        >
                          <DoubleCheckIcon size={13} color={isSeen ? "#60a5fa" : "rgba(255,255,255,0.7)"} />
                        </span>
                      )}
                    </div>
                  </div>
                  {isMine && <Avatar user={currentUser} size="small" className="message-avatar" />}
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="typing-indicator-row">
              <div className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span>{supplier?.name || "Supplier"} is typing...</span>
            </div>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
        <form className="message-compose" onSubmit={sendMessage}>
          <input
            value={message}
            onChange={handleInputChange}
            placeholder={supplier ? `Message ${supplier.name}...` : "Select a supplier first"}
            disabled={!supplier || !conversation}
          />
          <button
            className="send-button"
            type="submit"
            aria-label="Send message"
            disabled={!supplier || !conversation || !message.trim()}
          >
            <SendIcon size={14} />
          </button>
        </form>
      </section>
    </div>
  );
}

function BusinessProfile({ user, onUserUpdated, profileSaved, setProfileSaved }) {
  const [profile, setProfile] = useState(user || {});
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "preview"
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const update = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    if (profileSaved && setProfileSaved) setProfileSaved(false);
    setSaveError("");
  };

  async function save() {
    setSaving(true);
    setSaveError("");
    try {
      const updated = await profileApi.update(profile._id, profile);
      localStorage.setItem("chaindaan_user", JSON.stringify(updated));
      setProfile(updated);
      if (onUserUpdated) onUserUpdated(updated);
      if (setProfileSaved) setProfileSaved(true);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-content profile-content">
      <div className="welcome-row">
        <div>
          <h2>Business Profile & Details</h2>
          <p>Configure how your business store, contact information, and delivery terms appear to suppliers.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="primary-action"
            style={{ background: activeTab === "preview" ? "#52617c" : "#2155d9", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setActiveTab((tab) => (tab === "edit" ? "preview" : "edit"))}
            type="button"
          >
            {activeTab === "edit" ? <><EyeIcon size={15} /> Preview Profile</> : <><EditIcon size={15} /> Edit Details</>}
          </button>
          <button
            className="primary-action"
            onClick={save}
            disabled={saving}
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {saving ? "Saving..." : profileSaved ? <><CheckIcon size={15} /> Saved</> : "Save changes"}
          </button>
        </div>
      </div>

      {saveError && (
        <div style={{ color: "#d13636", background: "#fee2e2", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "12px", fontWeight: "600" }}>
          {saveError}
        </div>
      )}

      <section className="dashboard-card profile-card">
        {/* Glassmorphism Profile Cover Banner with side contact meta */}
        <div className="profile-cover">
          <div className="profile-cover-content">
            <ProfilePictureUpload
              user={profile}
              onUpdated={(updated) => {
                setProfile(updated);
                if (onUserUpdated) onUserUpdated(updated);
              }}
            />
            <div className="profile-cover-meta">
              <div className="profile-meta-header">
                <h2 className="profile-cover-name">{profile.name || "Your Business Name"}</h2>
                <VerifiedBadgeIcon size={20} />
              </div>
              {profile.fullName && (
                <p className="profile-meta-fullname">
                  <UserIcon size={14} /> Contact Person: {profile.fullName}
                </p>
              )}
              <div className="profile-meta-contact-row">
                {profile.email && (
                  <span className="profile-meta-chip">
                    <MailIcon size={13} /> {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="profile-meta-chip">
                    <PhoneIcon size={13} /> {profile.phone}
                  </span>
                )}
                {profile.town && (
                  <span className="profile-meta-chip">
                    <MapPinIcon size={13} /> {profile.town}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {activeTab === "edit" ? (
          <div className="profile-fields">
            <label>
              BUSINESS / STORE NAME *
              <input
                value={profile.name || ""}
                onChange={update("name")}
                placeholder="e.g. North Coast Cafe & Grocery"
                required
              />
            </label>

            <label>
              CONTACT PERSON / OWNER NAME
              <input
                value={profile.fullName || ""}
                onChange={update("fullName")}
                placeholder="e.g. Maria Santos"
              />
            </label>

            <label>
              BUSINESS TYPE / CATEGORY
              <select value={profile.category || "Restaurant & Food Service"} onChange={update("category")}>
                <option value="Restaurant & Food Service">Restaurant & Food Service</option>
                <option value="Retail & Sari-Sari Store">Retail & Sari-Sari Store</option>
                <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                <option value="Hotel & Hospitality">Hotel & Hospitality</option>
                <option value="Bakery & Cafe">Bakery & Cafe</option>
                <option value="Wholesale & Trading">Wholesale & Trading</option>
                <option value="General Merchandise">General Merchandise</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              MUNICIPALITY / LOCATION *
              <input
                value={profile.town || ""}
                onChange={update("town")}
                placeholder="e.g. Laoag City"
                required
              />
            </label>

            <label>
              EMAIL ADDRESS *
              <input
                type="email"
                value={profile.email || ""}
                onChange={update("email")}
                placeholder="business@example.com"
                required
              />
            </label>

            <label>
              PHONE NUMBER *
              <input
                value={profile.phone || ""}
                onChange={update("phone")}
                placeholder="0917-XXX-XXXX"
              />
            </label>

            <label className="full-field">
              DEFAULT DELIVERY ADDRESS / DESTINATION
              <input
                value={profile.deliveryInfo || ""}
                onChange={update("deliveryInfo")}
                placeholder="e.g. Door 2, Rizal St., Brgy 1, Laoag City"
              />
            </label>

            <label className="full-field">
              OPERATING / BUSINESS HOURS
              <input
                value={profile.businessHours || ""}
                onChange={update("businessHours")}
                placeholder="e.g. Mon - Sun: 7:00 AM - 9:00 PM"
              />
            </label>

            <label className="full-field">
              ABOUT YOUR BUSINESS / SOURCING NEEDS
              <textarea
                value={profile.about || ""}
                onChange={update("about")}
                placeholder="Tell suppliers about your business, volume requirements, preferred delivery days, and quality standards..."
              />
            </label>
          </div>
        ) : (
          <div className="profile-preview-container">
            <div className="card-heading">
              <div>
                <p className="dashboard-kicker">SUPPLIER PERSPECTIVE PREVIEW</p>
                <h3>How Suppliers See Your Business</h3>
              </div>
              <span className="preview-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <VerifiedBadgeIcon size={13} /> Live Profile
              </span>
            </div>

            {/* Buyer Directory / Order Card Preview */}
            <div style={{ maxWidth: "480px", marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#8290a8", marginBottom: "8px" }}>
                1. BUYER ORDER & INQUIRY CARD
              </p>
              <article className="supplier-card" style={{ pointerEvents: "none" }}>
                <div className="supplier-card-head">
                  <Avatar user={profile} color="blue" size="chat" />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <h3>{profile.name || "Your Business Name"}</h3>
                      <VerifiedBadgeIcon size={15} />
                    </div>
                    <span>
                      {profile.town || "Location"} · {profile.category || "Restaurant & Food Service"}
                    </span>
                  </div>
                </div>
                <p>{profile.about || "Your business description and sourcing requirements will appear here..."}</p>
                {(profile.deliveryInfo || profile.phone) && (
                  <div className="supplier-meta-tags">
                    {profile.deliveryInfo && (
                      <span className="meta-tag delivery">
                        <TruckIcon size={12} /> {profile.deliveryInfo}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="meta-tag min-order">
                        <PhoneIcon size={12} /> {profile.phone}
                      </span>
                    )}
                  </div>
                )}
              </article>
            </div>

            {/* Full Details Preview */}
            <div>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#8290a8", marginBottom: "8px" }}>
                2. BUSINESS CONTACT & PROFILE SUMMARY
              </p>
              <section className="dashboard-card supplier-detail-card" style={{ pointerEvents: "none" }}>
                <div className="supplier-detail-head">
                  <Avatar user={profile} size="large" />
                  <div className="supplier-detail-info">
                    <div className="supplier-detail-title">
                      <h3>{profile.name || "Your Business Name"}</h3>
                      <VerifiedBadgeIcon size={18} />
                      {profile.category && <span className="category-pill">{profile.category}</span>}
                    </div>
                    {profile.fullName && (
                      <p className="supplier-contact-name" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <UserIcon size={14} /> Contact Person: <strong>{profile.fullName}</strong>
                      </p>
                    )}
                    <p className="supplier-detail-meta" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <span><MapPinIcon size={13} /> {profile.town || "Ilocos Norte"}</span>
                      {profile.phone && <span><PhoneIcon size={13} /> {profile.phone}</span>}
                      {profile.email && <span><MailIcon size={13} /> {profile.email}</span>}
                    </p>
                  </div>
                </div>
                <div className="supplier-detail-body">
                  <div className="supplier-info-block">
                    <h4>About the Business</h4>
                    <p>{profile.about || "Your business description, volume requirements, and sourcing focus..."}</p>
                  </div>
                  <div className="supplier-info-grid">
                    {profile.businessHours && (
                      <div className="info-chip">
                        <span className="info-icon"><ClockIcon size={18} /></span>
                        <div>
                          <strong>Business Hours</strong>
                          <span>{profile.businessHours}</span>
                        </div>
                      </div>
                    )}
                    {profile.deliveryInfo && (
                      <div className="info-chip">
                        <span className="info-icon"><TruckIcon size={18} /></span>
                        <div>
                          <strong>Delivery Address</strong>
                          <span>{profile.deliveryInfo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
