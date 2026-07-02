import { useState, useEffect } from 'react';
import {
  Button,
  Select,
  Typography,
  Space,
  Card,
  Table,
  Tag,
  Alert,
  Layout,
  Row,
  Col,
  Statistic,
} from 'antd';
import 'antd/dist/reset.css';
import './App.css';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;

interface Customer {
  customer_email: string;
  total_points: number;
  points_available: number;
  total_spent: number;
  transaction_count: number;
}

interface Transaction {
  transaction_id: string;
  transaction_date: string;
  product_category: string;
  amount: number;
  points_earned: number;
}

interface Redemption {
  redemption_id: string;
  redemption_date: string;
  reward_type: string;
  points_redeemed: number;
}

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rewardType, setRewardType] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchTransactions(selectedCustomer.customer_email);
      fetchRedemptions(selectedCustomer.customer_email);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data.customers || []);
      if (data.customers && data.customers.length > 0) {
        setSelectedCustomer(data.customers[0]);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load customers');
      setLoading(false);
    }
  };

  const fetchTransactions = async (email: string) => {
    try {
      const response = await fetch(`/api/transactions/${email}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const fetchRedemptions = async (email: string) => {
    try {
      const response = await fetch(`/api/redemptions/${email}`);
      const data = await response.json();
      setRedemptions(data.redemptions || []);
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    }
  };

  const handleRedeem = async () => {
    setError(null);
    setSuccess(null);

    if (!rewardType) {
      setError('Please select a reward type');
      return;
    }

    const pointsMatch = rewardType.match(/\((\d+) points\)/);
    if (!pointsMatch) {
      setError('Invalid reward type selected');
      return;
    }

    const points = parseInt(pointsMatch[1]);
    if (selectedCustomer && points > selectedCustomer.points_available) {
      setError(
        `Insufficient points. You need ${points} points but only have ${selectedCustomer.points_available} available.`
      );
      return;
    }

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: selectedCustomer?.customer_email,
          points_redeemed: points,
          reward_type: rewardType,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Successfully redeemed ${points} points for ${rewardType}!`);
        setRewardType('');
        if (selectedCustomer) {
          fetchRedemptions(selectedCustomer.customer_email);
        }
      } else {
        setError(data.error || 'Redemption failed');
      }
    } catch (err) {
      setError('Failed to process redemption');
    }
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
    },
    {
      title: 'Category',
      dataIndex: 'product_category',
      key: 'product_category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Points Earned',
      dataIndex: 'points_earned',
      key: 'points_earned',
      render: (points: number) => <Tag color="green">+{points}</Tag>,
    },
  ];

  const redemptionColumns = [
    {
      title: 'Date',
      dataIndex: 'redemption_date',
      key: 'redemption_date',
    },
    {
      title: 'Redemption ID',
      dataIndex: 'redemption_id',
      key: 'redemption_id',
    },
    {
      title: 'Reward Type',
      dataIndex: 'reward_type',
      key: 'reward_type',
      render: (reward: string) => <Tag color="gold">{reward}</Tag>,
    },
    {
      title: 'Points Redeemed',
      dataIndex: 'points_redeemed',
      key: 'points_redeemed',
      render: (points: number) => <Tag color="red">-{points}</Tag>,
    },
  ];

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', padding: '40px', background: '#f0f2f5' }}>
        <Content>
          <div style={{ textAlign: 'center' }}>
            <Text>Loading...</Text>
          </div>
        </Content>
      </Layout>
    );
  }

  if (!selectedCustomer) {
    return (
      <Layout style={{ minHeight: '100vh', padding: '40px', background: '#f0f2f5' }}>
        <Content>
          <div style={{ textAlign: 'center' }}>
            <Text>No customers found</Text>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px' }}>
      <Content style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={1} style={{ marginBottom: 8 }}>
                🥐 Bakehouse Rewards
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Customer Loyalty Portal - Built with Ant Design (Databricks AppKit)
              </Text>
            </div>
          </Card>

          {/* Customer Selector */}
          <Card>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Select Customer</Text>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={selectedCustomer.customer_email}
                onChange={(value) => {
                  const customer = customers.find((c) => c.customer_email === value);
                  if (customer) setSelectedCustomer(customer);
                }}
              >
                {customers.map((customer) => (
                  <Option key={customer.customer_email} value={customer.customer_email}>
                    {customer.customer_email}
                  </Option>
                ))}
              </Select>
            </Space>
          </Card>

          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Points"
                  value={selectedCustomer.total_points || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Available Points"
                  value={selectedCustomer.points_available || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Spent"
                  value={selectedCustomer.total_spent || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Transactions"
                  value={selectedCustomer.transaction_count || 0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Redeem Points Section */}
          <Card title="💳 Redeem Points">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {error && (
                <Alert
                  message={error}
                  type="error"
                  closable
                  onClose={() => setError(null)}
                  showIcon
                />
              )}
              {success && (
                <Alert
                  message={success}
                  type="success"
                  closable
                  onClose={() => setSuccess(null)}
                  showIcon
                />
              )}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Reward Type
                </Text>
                <Select
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Select reward..."
                  value={rewardType}
                  onChange={(value) => setRewardType(value)}
                >
                  <Option value="Free Coffee (100 points)">☕ Free Coffee (100 points)</Option>
                  <Option value="Free Pastry (150 points)">🥐 Free Pastry (150 points)</Option>
                  <Option value="$5 Discount (250 points)">💵 $5 Discount (250 points)</Option>
                  <Option value="$10 Discount (500 points)">💰 $10 Discount (500 points)</Option>
                </Select>
              </div>
              <Button type="primary" size="large" onClick={handleRedeem} disabled={!rewardType}>
                Redeem Now
              </Button>
            </Space>
          </Card>

          {/* Recent Transactions */}
          <Card title="📊 Recent Transactions">
            <Table
              dataSource={transactions}
              columns={transactionColumns}
              rowKey="transaction_id"
              pagination={false}
              locale={{ emptyText: 'No transactions yet' }}
            />
          </Card>

          {/* Redemption History */}
          <Card title="🎁 Redemption History">
            <Table
              dataSource={redemptions}
              columns={redemptionColumns}
              rowKey="redemption_id"
              pagination={false}
              locale={{ emptyText: 'No redemptions yet' }}
            />
          </Card>
        </Space>
      </Content>
    </Layout>
  );
}

export default App;