import React, { useState, useEffect } from "react";
import { Card, Row, Col, ProgressBar, Spinner } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const COLORS = [
  "var(--accent)",
  "#a29bfe",
  "#74b9ff",
  "#81ecec",
  "rgba(255, 255, 255, 0.7)",
];

const UserStatsWidget = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const host = process.env.REACT_APP_NETWORK_HOST;

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await axios.get(`${host}interactions/user-stats`, {
          params: { user_id: userId },
        });

        setStats(response.data.stats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError("Failed to load statistics");
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId, host]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <div className="text-danger">{error}</div>;
  if (!stats) return <div>No statistics available</div>;

  return (
    <div className="stats-widget">
      <Card
        className="shadow-sm mb-4"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          color: "var(--text-light)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Card.Header
          as="h5"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            color: "var(--text-light)",
          }}
        >
          {`${sessionStorage.getItem("userName")}'s Viewing Stats`}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} lg={3} className="text-center mb-3">
              <div className="stat-card">
                <h3>{stats.watch_time_hours || 0}</h3>
                <p>Watch Hours</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="text-center mb-3">
              <div className="stat-card">
                <h3>{stats.total_comments || 0}</h3>
                <p>Total Comments Left</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="text-center mb-3">
              <div className="stat-card">
                <h3>{stats.total_ratings || 0}</h3>
                <p>Total Ratings Given</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="text-center mb-3">
              <div className="stat-card">
                <h3>{stats.avg_rating ? stats.avg_rating.toFixed(1) : 0}/5</h3>
                <p>Average Rating Given</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="text-center mb-3">
              <div className="stat-card">
                <h3>{stats.seasons_watched || 0}</h3>
                <p>Seasons Watched</p>
              </div>
            </Col>
            <Col md={6} lg={3} className="text-center mb-3">
              <div className="stat-card">
                <h3>{stats.episodes_watched || 0}</h3>
                <p>Episodes Watched</p>
              </div>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Card
                className="my-3"
                style={{ backgroundColor: "var(--sidebar-bg)" }}
              >
                <Card.Header>
                  <Card.Title style={{ color: "var(--text-light)" }}>
                    Media Type Distribution
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Movies", value: stats.movie_count || 0 },
                          { name: "TV Shows", value: stats.tv_count || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {[0, 1].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            {/* Top Production Companies */}
            {stats.top_producers && stats.top_producers.length > 0 && (
              <Col md={6}>
                <Card
                  className="my-3"
                  style={{ backgroundColor: "var(--sidebar-bg)" }}
                >
                  <Card.Header>
                    <Card.Title style={{ color: "var(--text-light)" }}>
                      Top Production Companies
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.top_producers}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={60}
                          fill="#8884d8"
                          label={({ name, percent }) =>
                            name.length > 15
                              ? `${name.substring(0, 15)}...: ${(
                                  percent * 100
                                ).toFixed(0)}%`
                              : `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {stats.top_producers.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} titles`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3">
                      {stats.top_producers.map((producer, index) => (
                        <div
                          key={index}
                          className="d-flex justify-content-between align-items-center mb-1"
                        >
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                marginRight: "8px",
                              }}
                            ></div>
                            <span style={{ color: "var(--text-light)" }}>
                              {producer.name}
                            </span>
                          </div>
                          <span className="badge bg-primary">
                            {producer.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            <Col lg={6}>
              <h6>Top Genres</h6>
              {stats.top_genres &&
                stats.top_genres.map((genre, index) => (
                  <div key={index} className="mb-2">
                    <div className="d-flex justify-content-between">
                      <span>{genre.name}</span>
                      <span>{genre.count}</span>
                    </div>
                    <ProgressBar
                      now={genre.count}
                      max={stats.top_genres[0].count}
                      variant={COLORS[index % COLORS.length].replace("#", "")}
                    />
                  </div>
                ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserStatsWidget;
