import React, { useState, useEffect } from 'react';
import { Customer, Reward, Redemption, Transaction, REWARDS } from './types';
import './App.css';

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [netPoints, setNetPoints] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch customer details when selection changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerDetails(selectedCustomer.customerID);
    }
  }, [selectedCustomer?.customerID]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
      if (data.length > 0) {
        setSelectedCustomer(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: number) => {
    try {
      // Fetch customer with net points
      const customerResponse = await fetch(`/api/customers/${customerId}`);
      const customerData = await customerResponse.json();
      setNetPoints(customerData.net_points || customerData.points_available);

      // Fetch transactions
      const transactionsResponse = await fetch(`/api/customers/${customerId}/transactions`);
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData);

      // Fetch redemptions
      const redemptionsResponse = await fetch(`/api/customers/${customerId}/redemptions`);
      const redemptionsData = await redemptionsResponse.json();
      setRedemptions(redemptionsData);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!selectedCustomer) return;

    if (netPoints < reward.points_required) {
      alert('Not enough points to redeem this reward!');
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.customerID,
          reward_name: reward.name,
          points_redeemed: reward.points_required,
        }),
      });

      if (response.ok) {
        // Refresh customer details to show updated points and redemption history
        await fetchCustomerDetails(selectedCustomer.customerID);
        alert(`Successfully redeemed ${reward.name}!`);
      } else {
        alert('Failed to redeem reward. Please try again.');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Error redeeming reward. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🥐 Bakehouse Rewards</h1>
        <p className="tagline">Earn. Savor. Redeem.</p>
      </header>

      {/* Customer Selector */}
      <div className="customer-selector">
        <label htmlFor="customer-select">Select Customer:</label>
        <select
          id="customer-select"
          value={selectedCustomer?.customerID || ''}
          onChange={(e) => {
            const customer = customers.find(c => c.customerID === parseInt(e.target.value));
            if (customer) setSelectedCustomer(customer);
          }}
        >
          {customers.map((customer) => (
            <option key={customer.customerID} value={customer.customerID}>
              {customer.customer_name} ({customer.points_available} pts)
            </option>
          ))}
        </select>
      </div>

      {selectedCustomer && (
        <>
          {/* Rewards Card */}
          <div className="rewards-card">
            <div className="card-header">
              <h2>{selectedCustomer.customer_name}</h2>
              <p className="email">{selectedCustomer.email_address}</p>
            </div>
            <div className="points-display">
              <div className="points-large">{netPoints}</div>
              <div className="points-label">Points Available</div>
            </div>
            <div className="stats">
              <div className="stat">
                <span className="stat-value">${selectedCustomer.total_spend}</span>
                <span className="stat-label">Total Spend</span>
              </div>
              <div className="stat">
                <span className="stat-value">{selectedCustomer.transaction_count}</span>
                <span className="stat-label">Purchases</span>
              </div>
            </div>
          </div>

          {/* Available Rewards */}
          <section className="rewards-section">
            <h3>Available Rewards</h3>
            <div className="rewards-grid">
              {REWARDS.map((reward) => (
                <div key={reward.id} className="reward-card">
                  <div className="reward-icon">{reward.icon}</div>
                  <h4>{reward.name}</h4>
                  <p className="reward-description">{reward.description}</p>
                  <div className="reward-points">{reward.points_required} points</div>
                  <button
                    className="redeem-button"
                    onClick={() => handleRedeemReward(reward)}
                    disabled={netPoints < reward.points_required || redeeming}
                  >
                    {netPoints < reward.points_required ? 'Not Enough Points' : 'Redeem'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Purchases */}
          {transactions.length > 0 && (
            <section className="transactions-section">
              <h3>Recent Purchases</h3>
              <div className="transactions-list">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.transactionID} className="transaction-item">
                    <div>
                      <strong>{transaction.product}</strong>
                      <span className="transaction-qty"> x{transaction.quantity}</span>
                    </div>
                    <div className="transaction-price">${transaction.totalPrice}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Redemption History */}
          {redemptions.length > 0 && (
            <section className="redemptions-section">
              <h3>Redemption History</h3>
              <div className="redemptions-list">
                {redemptions.map((redemption) => (
                  <div key={redemption.redemption_id} className="redemption-item">
                    <div>
                      <strong>{redemption.reward_name}</strong>
                      <div className="redemption-date">
                        {new Date(redemption.redeemed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="redemption-points">-{redemption.points_redeemed} pts</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="app-footer">
        <p>Baked with love 💛</p>
      </footer>
    </div>
  );
};

export default App;
