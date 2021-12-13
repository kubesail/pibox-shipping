import { useEffect, useState } from "react";
import "./App.css";
import Easypost from "@easypost/api";
import serialize from "form-serialize";

const api = new Easypost("N/A", {
  baseUrl: `${window.origin}/v2/`,
});

const authorization = `Basic ${btoa(
  `${process.env.REACT_APP_KUBESAIL_PUBLIC_KEY}:${process.env.REACT_APP_KUBESAIL_SECRET_KEY}`
)}`;

const PARCEL_HACKER_BUNDLE =
  process.env.REACT_APP_EASYPOST_MODE === "live"
    ? "prcl_99744dbc8d67410d9ef83ce1539611a4"
    : "prcl_6b6e501acd2a4f59bca7ca303d9a40ee";

let shipment;

function App() {
  const [active, setActive] = useState(null);
  const [rates, setRates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [banner, setBanner] = useState({});

  const filteredOrders = orders.filter((order) => order.shippingCountryCode);
  const activeOrder = orders.find(
    (order) => order.kickstarterBackerUid === active
  );
  const activeOrderIndex = filteredOrders.findIndex(
    (order) => order.kickstarterBackerUid === active
  );

  // Fetch all orders once on page load
  useEffect(() => {
    async function fetchOrders() {
      const res = await window.fetch(
        "https://api.kubesail.com/admin/pibox/orders",
        {
          headers: { "content-type": "application/json", authorization },
        }
      );
      setOrders((await res.json()).orders);
    }
    fetchOrders();
  }, []);

  // Fetch new shipping data for selected record when it changes
  useEffect(() => {
    async function fetchShipping() {
      setRates([]);
      if (!activeOrder || !activeOrder?.shippingCountryCode) return;

      // fetch existing shipping data if a "shipment" object has been made.
      // NOTE this does not mean that it has been shipped!
      if (activeOrder.shippingId) {
        shipment = await api.Shipment.retrieve(activeOrder.shippingId);
        if (shipment.rates) setRates(shipment.rates);
        return;
      }

      shipment = await new api.Shipment({
        to_address: {
          name: activeOrder.shippingName,
          street1: activeOrder.shippingAddress1,
          street2: activeOrder.shippingAddress2,
          city: activeOrder.shippingCity,
          state: activeOrder.shippingState,
          zip: activeOrder.shippingPostalCode,
          phone: activeOrder.shippingPhoneNumber,
        },
        from_address: {
          company: "KubeSail, Inc.",
          street1: "951 20th St Unit 180",
          city: "Denver",
          state: "CO",
          zip: "80202",
          phone: "713-581-4848",
        },
        options: { label_format: "PDF" },
        parcel: PARCEL_HACKER_BUNDLE,
      }).save();
      // Save shipment ID to order via kubesail API
      await window.fetch(
        `https://api.kubesail.com/admin/pibox/order/${activeOrder.id}`,
        {
          method: "POST",
          headers: { "content-type": "application/json", authorization },
          body: JSON.stringify({ shippingId: shipment.id }),
        }
      );
      // display rates
      setRates(shipment.rates);

      // add shipping id to current row in orders state
      setOrders(
        orders.map((order) =>
          order.kickstarterBackerUid === active
            ? { ...order, shippingId: shipment.id }
            : order
        )
      );
    }
    fetchShipping();
  }, [active]);

  async function buyShipping(rateId) {
    const boughtShipment = await shipment.buy(rateId);
    console.log({ boughtShipment });

    // Save shipment ID to kubesail API
    await window.fetch(
      `https://api.kubesail.com/admin/pibox/order/${activeOrder.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization },
        body: JSON.stringify({
          shippingCarrier: boughtShipment.selected_rate.carrier,
          trackingNumber: boughtShipment.tracking_code,
          trackingURL: boughtShipment.tracker.public_url,
        }),
      }
    );

    printLabel(boughtShipment.postage_label.label_url);
    setRates([]);
    setOrders(
      orders.map((order) =>
        order.kickstarterBackerUid === active
          ? { ...order, trackingNumber: boughtShipment.tracking_code }
          : order
      )
    );

    let nextActiveIndex = activeOrderIndex;
    while (filteredOrders[nextActiveIndex]?.notes) {
      nextActiveIndex++;
    }
    if (filteredOrders[nextActiveIndex]) {
      setActive(filteredOrders[nextActiveIndex].kickstarterBackerUid);
    } else {
      setActive(null);
    }
  }

  async function printLabel(labelURL) {
    await fetch("/pibox/print-label", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: labelURL }),
    });
  }

  async function associateProductToOrder(serial, orderId) {
    // Save shipment ID to kubesail API
    await window.fetch(
      `https://api.kubesail.com/admin/pibox/product/${serial}`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization },
        body: JSON.stringify({ piboxOrderId: orderId }),
      }
    );
  }

  const sortedRates = rates.sort(function (a, b) {
    if (parseInt(a.rate, 10) < parseInt(b.rate, 10)) return -1;
    if (parseInt(a.rate, 10) > parseInt(b.rate, 10)) return 1;
    return 0;
  });

  return (
    <div className="App">
      <header
        className="App-header"
        style={{ backgroundColor: banner.background ? banner.background : "" }}
      >
        {banner.msg ? (
          <p>
            {banner.msg} <button onClick={() => setBanner({})}>OK</button>
          </p>
        ) : (
          <p>📦 PiBox Shipping Station</p>
        )}
      </header>
      <div>
        <form
          name="addproduct"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const body = serialize(form, { hash: true, empty: true });
            body.serial = body.serial.replace("https://pibox.io/help/", "");

            const res = await window.fetch(
              "https://api.kubesail.com/admin/pibox/product",
              {
                method: "POST",
                headers: { "content-type": "application/json", authorization },
                body: JSON.stringify(body),
              }
            );
            if (res.status !== 200) {
              setBanner({
                background: "#ff0000",
                msg: "Issue saving product! Perhaps this serial already exists?",
              });
            } else {
              setBanner({
                background: "#00ff00",
                msg: "Product Saved!",
              });
              setTimeout(() => setBanner({}), 1000);
            }
            await res.json();
            document.forms.addproduct.elements.serial.value = "";
          }}
        >
          <textarea
            name="mfgData"
            id=""
            cols="150"
            rows="5"
            defaultValue={
              `{\n` +
              `  "carrier": {"rev": 22, "vendor":"JLCPCB", "order": "3554464A-Y35-211027", "assembly": "JLCPCB"},\n` +
              `  "backplane": {"rev": 24, "vendor":"JLCPCB", "order": "3554464A-Y40-211120", "assembly": "JLCPCB + KubeSail"},\n` +
              `  "test": {"date": "2021-12-09T01:03:24.507Z"}\n` +
              `}\n`
            }
          />
          <input
            name="sku"
            type="text"
            className="wide-input"
            defaultValue={"Hacker Bundle"}
          />
          <input
            name="serial"
            type="text"
            className="wide-input"
            placeholder="scan QR serial to save mfgData"
          />
          <input type="submit" value="Save Product" />
        </form>
      </div>
      <div className="App-main">
        <section className="App-orders">
          <h2>
            {orders.length} Total - Showing {filteredOrders.length} with
            Shipping Country
          </h2>
          <table>
            <thead>
              <tr>
                <th>Backer Number</th>
                <th>Name</th>
                <th>Country</th>
                <th>Reward</th>
                <th>Shipping ID</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((row) => (
                <tr
                  className={
                    active === row.kickstarterBackerUid ? "active" : ""
                  }
                  key={row.kickstarterBackerUid}
                  onClick={() => setActive(row.kickstarterBackerUid)}
                >
                  <td>{row.kickstarterBackerNumber}</td>
                  <td>{row.shippingName}</td>
                  <td>{row.shippingCountryCode}</td>
                  <td>{row.orderDetails?.reward}</td>
                  <td>{row.shippingId}</td>
                  <td>{row.notes?.substr(0, 10)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="App-details">
          {activeOrder ? (
            <div>
              {activeOrder.shippingId && <h2>{activeOrder.shippingId}</h2>}

              <form
                name="buypostage"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const body = serialize(form, { hash: true, empty: true });
                  body.serial = body.serial.replace(
                    "https://pibox.io/help/",
                    ""
                  );
                  associateProductToOrder(body.serial, activeOrder.id);
                  buyShipping(sortedRates[0]);
                  document.forms.buypostage.elements.serial.value = "";
                }}
              >
                <input
                  type="text"
                  id="serial"
                  name="serial"
                  className="wide-input"
                  placeholder="scan QR serial to ship w/ lowest rate"
                />
              </form>

              {activeOrder.notes && (
                <div
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 20,
                    fontSize: 20,
                  }}
                >
                  {activeOrder.notes}
                </div>
              )}

              {activeOrder.trackingNumber ? (
                <h2 style={{ color: "green" }}>
                  ✔ Shipped{" "}
                  <button
                    onClick={() => printLabel(shipment.postage_label.label_url)}
                  >
                    reprint
                  </button>
                </h2>
              ) : !activeOrder.shippingAddress1 ? (
                <h2 style={{ color: "red" }}>Incomplete Address</h2>
              ) : rates.length === 0 ? (
                <h2>Fetching Rates...</h2>
              ) : (
                <table>
                  <tbody>
                    {sortedRates.map((rate) => (
                      <tr key={rate.id}>
                        <td>{rate.carrier}</td>
                        <td>{rate.service}</td>
                        <td>{rate.delivery_days}</td>
                        <td>${rate.rate}</td>
                        <td>
                          <button
                            style={{ padding: "2px 12px" }}
                            onClick={() => buyShipping(rate.id)}
                          >
                            Buy Postage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <hr />
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(activeOrder).map((key) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{JSON.stringify(activeOrder[key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            "No Order Selected"
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
