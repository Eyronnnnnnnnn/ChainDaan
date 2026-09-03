import { useEffect, useState, useRef } from "react";
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { io } from "socket.io-client";
import "./SupplierDashboard.css";
import { getCurrentUser, logout } from "../lib/session.js";
import { idValue, mergeMessages } from "../lib/chat.js";
import { chatApi, orderApi, productApi, profileApi } from "../api/client.js";
import ProfilePictureUpload from "../components/ProfilePictureUpload.jsx";
import Avatar from "../components/Avatar.jsx";
import {
  HomeIcon,
  GridIcon,
  ShoppingBagIcon,
  MessageSquareIcon,
  MenuIcon,
  TrendingUpIcon,
  UserIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
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
  PlusIcon,
  PackageIcon,
} from "../components/Icons.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

function formatMessageTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ProductArt({ color }) {
  return (
    <div className={`product-art ${color}`}>
      <PackageIcon size={20} />
    </div>
  );
}

export default function SupplierDashboard() {
  const [user, setUser] = useState(() => getCurrentUser() || {});
  const displayName = user.name || user.fullName || "Supplier";
  const [activeView, setActiveView] = useState("Overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [message, setMessage] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Food & Grain",
    price: "",
    stock: "",
    images: [],
  });
  const [productSearch, setProductSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;

  useEffect(() => {
    productApi
      .list()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    orderApi
      .list()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => setOrders([]));

    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socket.on("presence:init", (userIds) => setOnlineUserIds(userIds));
    socket.on("presence:update", ({ userId, online }) => {
      setOnlineUserIds((current) =>
        online
          ? current.includes(userId) ? current : [...current, userId]
          : current.filter((id) => id !== userId)
      );
    });
    socket.on("newOrder", (newOrder) => {
      setOrders((current) => [newOrder, ...current.filter((o) => o._id !== newOrder._id)]);
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
  }, [user._id]);

  useEffect(() => {
    chatApi
      .conversations()
      .then((conversations) => {
        const currentId = user._id;
        const formatted = conversations.map((conversation) => {
          const business = conversation.participantIds.find(
            (participant) => participant._id !== currentId
          );
          return {
            id: conversation._id,
            conversationId: conversation._id,
            recipientId: business?._id,
            name: business?.name || "Business",
            preview: "Open conversation",
            time: "",
            unread: 0,
            user: business,
            color: "blue",
          };
        });
        const uniqueChats = [...new Map(formatted.map((chat) => [idValue(chat.recipientId), chat])).values()];
        setChats(uniqueChats);
        setSelectedChat(uniqueChats[0] || null);
      })
      .catch(() => setChats([]));
  }, [user._id]);

  useEffect(() => {
    if (!selectedChat?.conversationId) return undefined;
    let cancelled = false;
    chatApi.messages(selectedChat.conversationId).then((messages) => {
      if (!cancelled) setChatMessages((current) => mergeMessages(current, messages));
    });
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socket.on("connect", () => {
      socket.emit("joinConversation", selectedChat.conversationId);
      socket.emit("markSeen", { conversationId: selectedChat.conversationId });
    });
    socket.on("message", (incoming) => {
      if (incoming.conversationId === selectedChat.conversationId) {
        setChatMessages((current) => mergeMessages(current, incoming));
        socket.emit("markSeen", { conversationId: selectedChat.conversationId });
      }
    });
    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [selectedChat?.conversationId]);

  async function addProduct(event) {
    event.preventDefault();
    const product = await productApi.create(productForm);
    setProducts((current) => [...current, product]);
    setProductForm({ name: "", category: "Food & Grain", price: "", stock: "", images: [] });
    setShowAddProduct(false);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!message.trim() || !selectedChat) return;
    const sent = await chatApi.sendMessage(
      selectedChat.conversationId,
      selectedChat.recipientId,
      message
    );
    setChatMessages((current) => mergeMessages(current, sent));
    setChats((current) =>
      current.map((chat) =>
        chat.id === selectedChat.id ? { ...chat, preview: `You: ${message}`, time: "Just now" } : chat
      )
    );
    setMessage("");
  }

  function handleMessageBuyer(buyerObj) {
    if (!buyerObj?._id) return;
    const existing = chats.find((c) => idValue(c.recipientId) === idValue(buyerObj._id));
    if (existing) {
      setSelectedChat(existing);
      setActiveView("Messages");
    } else {
      chatApi.createConversation(buyerObj._id).then((result) => {
        const newChat = {
          id: result._id,
          conversationId: result._id,
          recipientId: buyerObj._id,
          name: buyerObj.name || "Business",
          preview: "Open conversation",
          time: "",
          unread: 0,
          user: buyerObj,
          color: "blue",
        };
        setChats((current) => [newChat, ...current]);
        setSelectedChat(newChat);
        setActiveView("Messages");
      });
    }
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
            <span>Supplier account</span>
          </div>
          <span className="online-dot" />
        </div>
        <nav className="dashboard-nav" aria-label="Supplier dashboard navigation">
          {["Overview", "My Products", "Incoming Orders", "Messages", "Sales Overview", "My Profile"].map(
            (view) => (
              <button
                key={view}
                className={activeView === view ? "active" : ""}
                onClick={() => { setActiveView(view); setSidebarOpen(false); }}
                type="button"
              >
                <span className="dashboard-icon">
                  {view === "Overview" && <HomeIcon size={17} />}
                  {view === "My Products" && <GridIcon size={17} />}
                  {view === "Incoming Orders" && <ShoppingBagIcon size={17} />}
                  {view === "Messages" && <MessageSquareIcon size={17} />}
                  {view === "Sales Overview" && <TrendingUpIcon size={17} />}
                  {view === "My Profile" && <UserIcon size={17} />}
                </span>
                {view}
                {view === "Incoming Orders" && pendingOrdersCount > 0 && <em>{pendingOrdersCount}</em>}
              </button>
            )
          )}
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
            <p className="dashboard-kicker">SUPPLIER WORKSPACE</p>
            <h1>{activeView}</h1>
          </div>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((current) => !current)}
              type="button"
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <button className="icon-button" type="button" aria-label="Notifications" onClick={() => setNotificationsOpen((current) => !current)}>
              <BellIcon size={18} />
              {pendingOrdersCount > 0 && <b>{pendingOrdersCount}</b>}
            </button>
            {notificationsOpen && (
              <div className="notification-panel" role="status">
                <strong>Notifications</strong>
                {pendingOrdersCount > 0 ? (
                  <button type="button" onClick={() => { setActiveView("Incoming Orders"); setNotificationsOpen(false); }}>
                    <ShoppingBagIcon size={15} /> {pendingOrdersCount} order{pendingOrdersCount === 1 ? "" : "s"} waiting for approval
                  </button>
                ) : <span>You&apos;re all caught up.</span>}
              </div>
            )}
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

        {activeView === "Overview" && (
          <Overview
            products={products}
            orders={orders}
            setActiveView={setActiveView}
            setShowAddProduct={setShowAddProduct}
            user={user}
            pendingOrdersCount={pendingOrdersCount}
          />
        )}
        {activeView === "My Products" && (
          <Products
            products={products}
            setProducts={setProducts}
            setShowAddProduct={setShowAddProduct}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
          />
        )}
        {activeView === "Incoming Orders" && (
          <SupplierOrders
            orders={orders}
            setOrders={setOrders}
            onMessageBuyer={handleMessageBuyer}
          />
        )}
        {activeView === "Messages" && (
          <Messages
            chats={chats}
            selectedChat={selectedChat}
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            setSelectedChat={setSelectedChat}
            sendMessage={sendMessage}
            currentUser={user}
            onlineUserIds={onlineUserIds}
          />
        )}
        {activeView === "Sales Overview" && <SupplierSales products={products} orders={orders} />}
        {activeView === "My Profile" && (
          <Profile
            key={user?._id || "supplier-profile"}
            user={user}
            onUserUpdated={setUser}
            profileSaved={profileSaved}
            setProfileSaved={setProfileSaved}
          />
        )}
      </section>
      {showAddProduct && (
        <AddProduct
          productForm={productForm}
          setProductForm={setProductForm}
          addProduct={addProduct}
          close={() => setShowAddProduct(false)}
        />
      )}
    </main>
  );
}

function Overview({ products, orders = [], setActiveView, setShowAddProduct, user, pendingOrdersCount }) {
  const currentUser = user || getCurrentUser() || {};

  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <h2>
            Good day, {currentUser.name || currentUser.fullName || "Supplier"}
          </h2>
          <p>Here&apos;s what&apos;s happening with your store and incoming orders today.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {pendingOrdersCount > 0 && (
            <button
              className="primary-action"
              style={{ background: "#f59e0b", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setActiveView("Incoming Orders")}
              type="button"
            >
              <ClockIcon size={15} /> Review {pendingOrdersCount} Pending Order{pendingOrdersCount > 1 ? "s" : ""}
            </button>
          )}
          <button
            className="primary-action"
            onClick={() => setShowAddProduct(true)}
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <PlusIcon size={15} /> Add Product
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="Total Products" value={products.length} change="Active listings" icon={<GridIcon size={20} />} />
        <Metric
          label="Pending Inquiries"
          value={pendingOrdersCount}
          change={pendingOrdersCount > 0 ? "Requires confirmation" : "Up to date"}
          icon={<ShoppingBagIcon size={20} />}
        />
        <Metric label="Total Orders" value={orders.length} change="All time" icon={<TrendingUpIcon size={20} />} />
        <Metric
          label="Confirmed Sales"
          value={`₱${orders
            .filter((o) => o.status === "confirmed" || o.status === "completed")
            .reduce((sum, o) => sum + Number(o.total || 0), 0)
            .toLocaleString()}`}
          change="Approved revenue"
          icon={<PackageIcon size={20} />}
        />
      </div>

      <div className="dashboard-columns">
        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <p className="dashboard-kicker">ACTION REQUIRED</p>
              <h3>Recent Incoming Orders</h3>
            </div>
            <button onClick={() => setActiveView("Incoming Orders")} type="button">
              View all ({orders.length}) →
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px 0" }}>
              <p>No incoming orders yet. When businesses order from your catalog, they will appear here.</p>
            </div>
          ) : (
            <div className="featured-products">
              {orders.slice(0, 3).map((order) => {
                const buyer = order.buyerId || {};
                const product = order.productId || {};
                return (
                  <div className="product-row" key={order._id}>
                    <ProductArt color="rice" />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <b>{buyer.name || "Business Buyer"}</b>
                        <VerifiedBadgeIcon size={13} />
                      </div>
                      <span>
                        {product.name || "Product"} · {order.quantity} units
                      </span>
                    </div>
                    <strong>₱{Number(order.total || 0).toLocaleString()}</strong>
                    <span
                      className={`order-status-badge ${order.status}`}
                      style={{ fontSize: "10px", padding: "2px 8px" }}
                    >
                      {order.status === "pending" && <><ClockIcon size={11} /> Pending</>}
                      {order.status === "confirmed" && <><CheckIcon size={11} /> Approved</>}
                      {order.status === "completed" && <><PackageIcon size={11} /> Done</>}
                      {order.status === "cancelled" && <><XIcon size={11} /> Cancelled</>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-card activity-card">
          <div className="card-heading">
            <div>
              <p className="dashboard-kicker">YOUR CATALOG</p>
              <h3>Featured products</h3>
            </div>
            <button onClick={() => setActiveView("My Products")} type="button">
              View catalog →
            </button>
          </div>
          <div className="featured-products">
            {products.slice(0, 3).map((product) => (
              <ProductRow key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SupplierOrders({ orders, setOrders, onMessageBuyer }) {
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  async function updateStatus(orderId, newStatus) {
    const confirmMessage =
      newStatus === "confirmed"
        ? "Confirm and approve this order? The buyer will be notified immediately and stock will be reserved."
        : newStatus === "cancelled"
        ? "Decline and cancel this order inquiry?"
        : "Mark this order as delivered and completed?";

    if (!window.confirm(confirmMessage)) return;

    setProcessingId(orderId);
    try {
      const updated = await orderApi.updateStatus(orderId, newStatus);
      setOrders((current) => current.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    } finally {
      setProcessingId(null);
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
          <h2>Incoming Orders & Inquiries</h2>
          <p>Review orders from businesses, confirm availability, and manage delivery fulfillment.</p>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="orders-filter-pills">
          {[
            ["all", "All", GridIcon],
            ["pending", "Pending approval", ClockIcon],
            ["confirmed", "Confirmed / preparing", CheckIcon],
            ["completed", "Delivered", PackageIcon],
            ["cancelled", "Declined", XIcon],
          ].map(([st, label, Icon]) => (
            <button
              key={st}
              className={filter === st ? "active" : ""}
              onClick={() => setFilter(st)}
              type="button"
            >
              <Icon size={13} />
              {label} {st === "all" ? orders.length : orders.filter((o) => o.status === st).length}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter === "all" ? "" : filter} orders found</h3>
          <p>Orders placed by businesses will appear here for you to confirm or decline.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const buyer = order.buyerId || {};
            const product = order.productId || {};
            const isProcessing = processingId === order._id;

            return (
              <div className="order-card" key={order._id}>
                <div className="order-card-head">
                  <div className="order-card-buyer">
                    <Avatar user={buyer} color="blue" size="chat" />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <h4 className="order-buyer-name">{buyer.name || "Business Buyer"}</h4>
                        <VerifiedBadgeIcon size={15} />
                      </div>
                      <p className="order-buyer-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {buyer.fullName && <span><UserIcon size={12} /> {buyer.fullName}</span>}
                        <span><MapPinIcon size={12} /> {order.deliveryTown || buyer.town || "Ilocos Norte"}</span>
                        {(order.contactPhone || buyer.phone) && <span><PhoneIcon size={12} /> {order.contactPhone || buyer.phone}</span>}
                      </p>
                    </div>
                  </div>

                  <div>
                    {order.status === "pending" && (
                      <span className="order-status-badge pending">
                        <ClockIcon size={12} /> Pending Approval
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
                        <XIcon size={12} /> Declined / Cancelled
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
                        {product.stock !== undefined && ` (${product.stock} in stock)`}
                      </p>
                      <strong>Total: ₱{Number(order.total || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="order-delivery-info">
                    <div>
                      <b>Delivery Address:</b> {order.deliveryAddress}, {order.deliveryTown}
                    </div>
                    <div>
                      <b>Payment Method:</b> {order.paymentMethod || "Cash on Delivery (COD)"}
                    </div>
                    {order.notes && (
                      <div>
                        <b>Buyer Notes:</b> &quot;{order.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                <div className={`order-progress ${order.status === "cancelled" ? "cancelled" : ""}`}>
                  {["pending", "confirmed", "completed"].map((stage, index) => {
                    const stageIndex = ["pending", "confirmed", "completed"].indexOf(order.status);
                    const isActive = order.status !== "cancelled" && index <= stageIndex;
                    return (
                      <div className={`progress-step ${isActive ? "active" : ""}`} key={stage}>
                        <span className="progress-dot">{isActive ? <CheckIcon size={11} /> : index + 1}</span>
                        <span>{stage === "pending" ? "Pending approval" : stage === "confirmed" ? "Preparing" : "Delivered"}</span>
                      </div>
                    );
                  })}
                  {order.status === "cancelled" && <span className="progress-cancelled"><XIcon size={12} /> Order declined</span>}
                </div>

                <div className="order-card-foot">
                  <span className="order-date-note">
                    Received on {new Date(order.createdAt || order.soldAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt || order.soldAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <div className="order-action-btns">
                    {order.status === "pending" && (
                      <>
                        <button
                          className="btn-action confirm"
                          onClick={() => updateStatus(order._id, "confirmed")}
                          disabled={isProcessing}
                          type="button"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <CheckIcon size={14} /> Approve Order
                        </button>
                        <button
                          className="btn-action decline"
                          onClick={() => updateStatus(order._id, "cancelled")}
                          disabled={isProcessing}
                          type="button"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                        >
                          <XIcon size={14} /> Decline
                        </button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <button
                        className="btn-action complete"
                        onClick={() => updateStatus(order._id, "completed")}
                        disabled={isProcessing}
                        type="button"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <PackageIcon size={14} /> Mark Delivered
                      </button>
                    )}
                    <button
                      className="btn-action chat"
                      onClick={() => onMessageBuyer(buyer)}
                      type="button"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <MessageSquareIcon size={14} /> Message Buyer
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

function Metric({ label, value, change, icon }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <span>{label}</span>
      <b>{value}</b>
      <small>{change}</small>
    </article>
  );
}

function ProductRow({ product }) {
  return (
    <div className="product-row">
      <ProductArt color={product.color || "new"} />
      <div>
        <b>{product.name}</b>
        <span>{product.category}</span>
      </div>
      <strong>₱{Number(product.price || 0).toLocaleString()}</strong>
      <small>{product.stock} in stock</small>
    </div>
  );
}

function Products({
  products,
  setProducts,
  setShowAddProduct,
  productSearch,
  setProductSearch,
}) {
  const visibleProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(productSearch.toLowerCase()))
  );
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <h2>Manage your products</h2>
          <p>Keep your catalog fresh and help businesses find what they need.</p>
        </div>
        <button
          className="primary-action"
          onClick={() => setShowAddProduct(true)}
          type="button"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <PlusIcon size={15} /> Add Product
        </button>
      </div>
      <div className="products-toolbar">
        <label className="directory-search" style={{ flex: 1, maxWidth: 360 }}>
          <SearchIcon size={16} />
          <input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder="Search products"
          />
        </label>
        <select defaultValue="all">
          <option value="all">All categories</option>
          <option>Food & Grain</option>
          <option>Agriculture</option>
          <option>Textiles</option>
        </select>
      </div>
      <section className="dashboard-card product-management">
        <div className="product-table-head">
          <span>PRODUCT</span>
          <span>CATEGORY</span>
          <span>PRICE</span>
          <span>STOCK</span>
          <span />
        </div>
        {visibleProducts.map((product) => (
          <div className="product-table-row" key={product.id || product._id}>
            <ProductArt color={product.color} />
            <div>
              <b>{product.name}</b>
              <span>{product.category}</span>
            </div>
            <span>{product.category}</span>
            <strong>₱{Number(product.price || 0).toLocaleString()}</strong>
            <span className={product.stock < 20 ? "low-stock" : "stock-ok"}>
              {product.stock} units
            </span>
            <button
              aria-label={`Delete ${product.name}`}
              onClick={() =>
                setProducts((current) =>
                  current.filter((item) => (item.id || item._id) !== (product.id || product._id))
                )
              }
              type="button"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

function Messages({
  chats,
  selectedChat,
  chatMessages,
  setSelectedChat,
  message,
  setMessage,
  sendMessage,
  currentUser = getCurrentUser() || {},
  onlineUserIds = [],
}) {
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!selectedChat?.conversationId) return;

    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinConversation", selectedChat.conversationId);
      socket.emit("markSeen", { conversationId: selectedChat.conversationId });
    });

    socket.on("userTyping", (data) => {
      if (data.conversationId === selectedChat.conversationId && data.userId !== currentUser._id) {
        setIsTyping(true);
      }
    });

    socket.on("userStopTyping", (data) => {
      if (data.conversationId === selectedChat.conversationId && data.userId !== currentUser._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedChat?.conversationId, currentUser._id]);

  function handleInputChange(e) {
    setMessage(e.target.value);
    if (socketRef.current && selectedChat?.conversationId) {
      socketRef.current.emit("typing", { conversationId: selectedChat.conversationId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && selectedChat?.conversationId) {
          socketRef.current.emit("stopTyping", { conversationId: selectedChat.conversationId });
        }
      }, 1500);
    }
  }

  function handleSend(e) {
    if (socketRef.current && selectedChat?.conversationId) {
      socketRef.current.emit("stopTyping", { conversationId: selectedChat.conversationId });
    }
    sendMessage(e);
  }

  const filteredChats = chats.filter((c) =>
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-layout">
      <section className="chat-list">
        <div className="messages-heading">
          <div>
            <p className="dashboard-kicker">COMMUNITY CHAT</p>
            <h2>Messages</h2>
          </div>
        </div>
        <div style={{ padding: "0 18px 12px" }}>
          <label className="directory-search" style={{ width: "100%", margin: 0 }}>
            <SearchIcon size={14} />
            <input
              className="chat-search"
              style={{ border: 0, padding: "8px 0" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations"
            />
          </label>
        </div>
        {filteredChats.map((chat) => (
          <button
            className={`chat-preview ${selectedChat?.id === chat.id ? "selected" : ""}`}
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            type="button"
          >
            <Avatar user={chat.user || { name: chat.name }} color={chat.color} size="chat" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <b>{chat.name}</b>
                <VerifiedBadgeIcon size={13} />
              </div>
              <span>{chat.preview}</span>
            </div>
            <small>{chat.time}</small>
          </button>
        ))}
        {filteredChats.length === 0 && (
          <div className="chat-empty-list">
            <MessageSquareIcon size={22} />
            <strong>{searchTerm ? "No matches found" : "No conversations yet"}</strong>
            <span>{searchTerm ? "Try another name." : "Messages from businesses will appear here."}</span>
          </div>
        )}
      </section>
      <section className="conversation">
        <header className="conversation-head">
          <Avatar
            user={selectedChat?.user || { name: selectedChat?.name }}
            color="blue"
            size="chat"
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <h3>{selectedChat?.name || "No conversations yet"}</h3>
              {selectedChat && <VerifiedBadgeIcon size={16} />}
            </div>
            <span className={onlineUserIds.includes(selectedChat?.recipientId) ? "presence online" : "presence"}>
              <i /> {onlineUserIds.includes(selectedChat?.recipientId) ? "Online now" : "Offline"}
            </span>
          </div>
        </header>
        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="conversation-empty">
              <div className="conversation-empty-icon"><MessageSquareIcon size={22} /></div>
              <strong>{selectedChat ? "Start the conversation" : "Choose a conversation"}</strong>
              <span>{selectedChat ? `Send a message to ${selectedChat.name}.` : "Select a business to view messages."}</span>
            </div>
          ) : (
            chatMessages.map((item) => {
              const isMine = item.senderId === currentUser._id;
              const sender = isMine ? currentUser : selectedChat?.user;
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
              <span>{selectedChat?.name || "Business"} is typing...</span>
            </div>
          )}
        </div>
        <form className="message-compose" onSubmit={handleSend}>
          <input
            value={message}
            onChange={handleInputChange}
            placeholder={
              selectedChat ? `Message ${selectedChat.name}...` : "Select a conversation first"
            }
            disabled={!selectedChat}
          />
          <button
            className="send-button"
            type="submit"
            aria-label="Send message"
            disabled={!selectedChat || !message.trim()}
          >
            <SendIcon size={14} />
          </button>
        </form>
      </section>
    </div>
  );
}

function SupplierSales({ products, orders = [] }) {
  const [period, setPeriod] = useState("Monthly");
  const saleOrders = orders.filter((order) => ["confirmed", "completed"].includes(order.status));
  const now = new Date();
  const currentYear = now.getFullYear();
  const formatPeso = (amount) => `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
  const totalFor = (matchingOrders) => matchingOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const monthlyValues = Array.from({ length: 12 }, (_, month) =>
    totalFor(saleOrders.filter((order) => {
      const date = new Date(order.soldAt || order.createdAt);
      return date.getFullYear() === currentYear && date.getMonth() === month;
    }))
  );
  const quarterlyValues = Array.from({ length: 4 }, (_, quarter) =>
    totalFor(saleOrders.filter((order) => {
      const date = new Date(order.soldAt || order.createdAt);
      return date.getFullYear() === currentYear && Math.floor(date.getMonth() / 3) === quarter;
    }))
  );
  const yearlyYears = Array.from({ length: 5 }, (_, index) => currentYear - 4 + index);
  const yearlyValues = yearlyYears.map((year) =>
    totalFor(saleOrders.filter((order) => new Date(order.soldAt || order.createdAt).getFullYear() === year))
  );
  const chartData = {
    Monthly: {
      labels: Array.from({ length: 12 }, (_, month) => new Date(currentYear, month).toLocaleString("en-PH", { month: "short" })),
      values: monthlyValues,
      total: formatPeso(totalFor(saleOrders.filter((order) => new Date(order.soldAt || order.createdAt).getFullYear() === currentYear && new Date(order.soldAt || order.createdAt).getMonth() === now.getMonth()))),
      title: `${currentYear} monthly sales`,
    },
    Quarterly: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      values: quarterlyValues,
      total: formatPeso(totalFor(saleOrders.filter((order) => new Date(order.soldAt || order.createdAt).getFullYear() === currentYear))),
      title: `${currentYear} quarterly sales`,
    },
    Yearly: {
      labels: yearlyYears.map(String),
      values: yearlyValues,
      total: formatPeso(totalFor(saleOrders)),
      title: "Yearly sales",
    },
  }[period];
  const currentMonthOrders = saleOrders.filter((order) => {
    const date = new Date(order.soldAt || order.createdAt);
    return date.getFullYear() === currentYear && date.getMonth() === now.getMonth();
  });
  const currentYearOrders = saleOrders.filter(
    (order) => new Date(order.soldAt || order.createdAt).getFullYear() === currentYear
  );
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: chartData.title,
        data: chartData.values,
        borderColor: "#43b8bd",
        backgroundColor: "#43b8bd",
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#43b8bd",
        pointBorderWidth: 2,
        tension: 0.35,
        fill: false,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1100, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (context) => ` ${formatPeso(Number(context.raw || 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#dfe4eb" },
        ticks: { color: "#69758a", font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#69758a", font: { size: 12 }, callback: (value) => formatPeso(Number(value)) },
        grid: { color: "#dfe4eb" },
      },
    },
  };
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="dashboard-kicker">STORE PERFORMANCE</p>
          <h2>Sales overview</h2>
          <p>Monitor sales performance across different time periods.</p>
        </div>
        <div className="period-filter" role="tablist" aria-label="Sales period">
          {["Monthly", "Quarterly", "Yearly"].map((item) => (
            <button
              className={period === item ? "selected" : ""}
              key={item}
              onClick={() => setPeriod(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="metric-grid">
        <Metric
          label="Monthly sales"
          value={formatPeso(totalFor(currentMonthOrders))}
          change={`${currentMonthOrders.length} confirmed orders this month`}
          icon={<TrendingUpIcon size={20} />}
        />
        <Metric
          label="Yearly sales"
          value={formatPeso(totalFor(currentYearOrders))}
          change={`${currentYearOrders.length} confirmed orders this year`}
          icon={<GridIcon size={20} />}
        />
        <Metric
          label="Orders this month"
          value={currentMonthOrders.length}
          change="Confirmed orders this month"
          icon={<ShoppingBagIcon size={20} />}
        />
        <Metric
          label="Products listed"
          value={products.length}
          change="Catalog active"
          icon={<PackageIcon size={20} />}
        />
      </div>
      <section className="dashboard-card sales-chart">
        <div className="card-heading">
          <div>
            <p className="dashboard-kicker">{period.toUpperCase()}</p>
            <h3>{chartData.title}</h3>
          </div>
          <span>{chartData.total} total</span>
        </div>
        <div className="chartjs-line-chart">
          <Line data={data} options={options} />
        </div>
      </section>
    </div>
  );
}

function Profile({ user, onUserUpdated, profileSaved, setProfileSaved }) {
  const [profile, setProfile] = useState(user);
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "preview"

  const update = (field) => (event) =>
    setProfile((current) => ({ ...current, [field]: event.target.value }));

  async function save() {
    const updated = await profileApi.update(profile._id, profile);
    localStorage.setItem("chaindaan_user", JSON.stringify(updated));
    setProfile(updated);
    if (onUserUpdated) onUserUpdated(updated);
    setProfileSaved(true);
  }

  return (
    <div className="dashboard-content profile-content">
      <div className="welcome-row">
        <div>
          <h2>Supplier Store Details</h2>
          <p>Configure how your supplier profile, products, and contact details appear to businesses.</p>
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
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {profileSaved ? <><CheckIcon size={15} /> Saved</> : "Save changes"}
          </button>
        </div>
      </div>

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
                <h2 className="profile-cover-name">{profile.name || "Your Supplier Store"}</h2>
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
              SUPPLIER / STORE NAME *
              <input
                value={profile.name || ""}
                onChange={update("name")}
                placeholder="e.g. Northstar Supply"
                required
              />
            </label>

            <label>
              CONTACT PERSON / OWNER NAME
              <input
                value={profile.fullName || ""}
                onChange={update("fullName")}
                placeholder="e.g. Juan dela Cruz"
              />
            </label>

            <label>
              PRIMARY CATEGORY
              <select value={profile.category || "Food & Grain"} onChange={update("category")}>
                <option value="Food & Grain">Food & Grain</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Textiles">Textiles</option>
                <option value="Crafts">Crafts</option>
                <option value="General Merchandise">General Merchandise</option>
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
                placeholder="store@example.com"
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

            <label>
              DELIVERY COVERAGE & TERMS
              <input
                value={profile.deliveryInfo || ""}
                onChange={update("deliveryInfo")}
                placeholder="e.g. Same-day delivery in Laoag, 1-2 days provincial"
              />
            </label>

            <label>
              MINIMUM ORDER REQUIREMENT
              <input
                value={profile.minimumOrder || ""}
                onChange={update("minimumOrder")}
                placeholder="e.g. ₱500 min. order / 5 units"
              />
            </label>

            <label className="full-field">
              OPERATING / BUSINESS HOURS
              <input
                value={profile.businessHours || ""}
                onChange={update("businessHours")}
                placeholder="e.g. Mon - Sat: 8:00 AM - 5:00 PM"
              />
            </label>

            <label className="full-field">
              ABOUT YOUR BUSINESS / STORE STORY
              <textarea
                value={profile.about || ""}
                onChange={update("about")}
                placeholder="Tell businesses about your products, sourcing practices, quality standards, and how you can support their store..."
              />
            </label>
          </div>
        ) : (
          <div className="profile-preview-container">
            <div className="card-heading">
              <div>
                <p className="dashboard-kicker">BUYER PERSPECTIVE PREVIEW</p>
                <h3>How Businesses See Your Profile</h3>
              </div>
              <span className="preview-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <VerifiedBadgeIcon size={13} /> Live Profile
              </span>
            </div>

            {/* Marketplace Card Preview */}
            <div style={{ maxWidth: "480px", marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#8290a8", marginBottom: "8px" }}>
                1. MARKETPLACE DIRECTORY CARD
              </p>
              <article className="supplier-card" style={{ pointerEvents: "none" }}>
                <div className="supplier-card-head">
                  <Avatar user={profile} color="blue" size="chat" />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <h3>{profile.name || "Your Supplier Name"}</h3>
                      <VerifiedBadgeIcon size={15} />
                    </div>
                    <span>
                      {profile.town || "Location"} · {profile.category || "Food & Grain"}
                    </span>
                  </div>
                </div>
                <p>{profile.about || "Your business description will appear here..."}</p>
                {(profile.minimumOrder || profile.deliveryInfo) && (
                  <div className="supplier-meta-tags">
                    {profile.minimumOrder && (
                      <span className="meta-tag min-order">
                        <PackageIcon size={12} /> Min. {profile.minimumOrder}
                      </span>
                    )}
                    {profile.deliveryInfo && (
                      <span className="meta-tag delivery">
                        <TruckIcon size={12} /> {profile.deliveryInfo}
                      </span>
                    )}
                  </div>
                )}
                <button className="contact-button" type="button">
                  Message supplier
                </button>
              </article>
            </div>

            {/* Full Details Preview */}
            <div>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#8290a8", marginBottom: "8px" }}>
                2. SUPPLIER DETAILS PAGE HEADER & INFO
              </p>
              <section className="dashboard-card supplier-detail-card" style={{ pointerEvents: "none" }}>
                <div className="supplier-detail-head">
                  <Avatar user={profile} size="large" />
                  <div className="supplier-detail-info">
                    <div className="supplier-detail-title">
                      <h3>{profile.name || "Your Supplier Name"}</h3>
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
                    <h4>About the Supplier</h4>
                    <p>{profile.about || "Your full business story and capabilities..."}</p>
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
                          <strong>Delivery Terms</strong>
                          <span>{profile.deliveryInfo}</span>
                        </div>
                      </div>
                    )}
                    {profile.minimumOrder && (
                      <div className="info-chip">
                        <span className="info-icon"><PackageIcon size={18} /></span>
                        <div>
                          <strong>Minimum Order</strong>
                          <span>{profile.minimumOrder}</span>
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

function AddProduct({ productForm, setProductForm, addProduct, close }) {
  return (
    <div className="modal-backdrop">
      <form className="product-modal" onSubmit={addProduct}>
        <button className="modal-close" onClick={close} type="button">
          ×
        </button>
        <p className="dashboard-kicker">NEW LISTING</p>
        <h2>Add a product</h2>
        <p>Give businesses the details they need to place an order.</p>
        <label>
          PRODUCT NAME
          <input
            required
            value={productForm.name}
            onChange={(event) =>
              setProductForm({ ...productForm, name: event.target.value })
            }
            placeholder="e.g. Ilocos Red Rice"
          />
        </label>
        <label>
          CATEGORY
          <select
            value={productForm.category}
            onChange={(event) =>
              setProductForm({ ...productForm, category: event.target.value })
            }
          >
            <option>Food & Grain</option>
            <option>Agriculture</option>
            <option>Textiles</option>
            <option>Crafts</option>
          </select>
        </label>
        <div className="modal-fields">
          <label>
            PRICE
            <input
              required
              type="number"
              min="1"
              value={productForm.price}
              onChange={(event) =>
                setProductForm({ ...productForm, price: event.target.value })
              }
              placeholder="0.00"
            />
          </label>
          <label>
            STOCK
            <input
              required
              type="number"
              min="0"
              value={productForm.stock}
              onChange={(event) =>
                setProductForm({ ...productForm, stock: event.target.value })
              }
              placeholder="0"
            />
          </label>
        </div>
        <label>
          PRODUCT PHOTOS
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) =>
              setProductForm({
                ...productForm,
                images: Array.from(event.target.files || []).slice(0, 10),
              })
            }
          />
          <small>Up to 10 images, 5 MB each.</small>
        </label>
        <button className="primary-action modal-submit" type="submit">
          Publish product
        </button>
      </form>
    </div>
  );
}