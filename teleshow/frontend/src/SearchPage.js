/*
Provides fucntionality for searcing movies and tv shows via Flask built API
*/
import React, { useState } from "react";
import axios from "axios";
import { Modal, Button, Spinner, Form, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function SearchPage() {
  const [query, setQuery] = useState(""); // Stores the search query input by user
  const [filterType, setFilterType] = useState("all"); //Filters output
  const [results, setResults] = useState({ tmdb_movie: [], tmdb_tv: [] }); // Stores search results categorized by media type
  const [loading, setLoading] = useState(false); // Tracks loading state during API requests
  const [selectedItem, setSelectedItem] = useState(null); // Stores detailed information about a selected item
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL; // Base URL for Flask API taken from environment variables
  const image_url = "https://image.tmdb.org/t/p/w500"; // Base URL for TMDB image paths

  // Handles the search form submission. Makes an API request to fetch search results based on the query
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Search triggered"); //Outputs status for debugging
    try {
      // Makes request to Flask API search endpoint with query and filter type
      const response = await axios.get(`${apiBaseUrl}/search`, {
        params: { query, filter_type: filterType },
      });

      setResults(response.data); // Update results state with API response
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
    setLoading(false);
  };

  // Handles click on a search result item /Fetches detailed information about the selected item

  const handleResultClick = async (item) => {
    setLoading(true);
    console.log("Type parameter:", item.media_type); // Outputs type to console for debugging purposes
    try {
      // Makes request to Flask API details endpoint with item ID and media type
      const response = await axios.get(`${apiBaseUrl}/search/details`, {
        params: { id: item.id, type: item.media_type },
      });
      setSelectedItem(response.data); // Store detailed item information
      console.log("Selected Item Details:", response.data);
    } catch (error) {
      console.error("error fetching details: ", error);
    }
    setLoading(false);
  };

  // Clears the selected item state. Used to close the details modal

  const clearSelection = () => {
    setSelectedItem(null);
  };


  return (
    <div className="container mt-5">
      {/*Search Bar and Dropdown Menu*/}
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for Movies or TV Shows"
        />
        <Form.Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          placeholder="Search for Movies or TV shows"
        >
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </Form.Select>
        <Button variant="primary" type="submit" onClick={handleSearch}>
          Search
        </Button>
      </InputGroup>

      {/*Loading Spinner styled with React-bootstrap*/}
      {/*Spinner is based on the loading state variable*/}
      {loading && (
        <Modal
          show={loading}
          backdrop="static"
          centered
          keyboard={false}
          size="sm"
        >
          <Modal.Body className="text-center py-4">
            <Spinner animation="border" role="status" variant="primary" />
            <span className="visually-hidden">Loading...</span>
          </Modal.Body>
        </Modal>
      )}

      {/* Movie Results Section */}
      {results.tmdb_movie.length > 0 && (
        <div className="container mt-4">
          <h2>Movie Results</h2>
          <div className="row">
            {results.tmdb_movie?.map((movie) => (
              // Individual Movie card, clickable to show details
              <div
                className="col-md-4 mb-4"
                key={movie.id}
                onClick={() => handleResultClick(movie)}
              >
                <div className="card h-100">
                  {movie.poster_url && (
                    // Movie poster
                    <img
                      src={movie.poster_url}
                      className="card-img-top"
                      alt={movie.title}
                    />
                  )}
                  {/* Movie Card Quick Details */}
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TV Shows Results Section */}
      {results.tmdb_tv.length > 0 && (
        <div className="container mt-4">
          <h2>Tv Results</h2>
          <div className="row">
            {results.tmdb_tv?.map((tv) => (
              // Individual TV show card, clickable to show details
              <div
                className="col-md-4 mb-4"
                key={tv.id}
                onClick={() => handleResultClick(tv)}
              >
                <div className="card h-100">
                  {tv.poster_url && (
                    // TV poster
                    <img
                      src={tv.poster_url}
                      className="card-img-top"
                      alt={tv.title}
                    />
                  )}
                  {/* TV Shows Card Quick Details */}
                  <div className="card-body">
                    <h5 className="card-title">{tv.name}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Displays the extra details of Movie or TV show on click*/}
      {selectedItem && (
        <Modal show={!!selectedItem} onHide={clearSelection}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedItem?.tmdb?.title || selectedItem?.tmdb?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img
              src={`${image_url}${selectedItem.tmdb.poster_path}`}
              alt={selectedItem.tmdb.title || selectedItem.tmdb.name}
              className="img-fluid"
            />
            {/* Displays release dates for movies or first air date for tv */}
            <p>
              <strong>Release Date: </strong>{" "}
              {selectedItem.tmdb.release_date ||
              selectedItem.tmdb.first_air_date ? (
                <>
                  {selectedItem.tmdb.release_date ||
                    selectedItem.tmdb.first_air_date}
                </>
              ) : (
                "N/A"
              )}
            </p>
            {/* Displays rounded rating out of 10 */}
            <p>
              <strong>Rating: </strong>{" "}
              {Math.round(selectedItem.tmdb.vote_average)}/10
            </p>
            <p>
              {/* Displays runtime for movies or number of seasons for TV shows */}
              <strong>Runtime/Seasons: </strong>{" "}
              {selectedItem.tmdb.runtime ||
              selectedItem.tmdb.number_of_seasons ? (
                <>
                  {selectedItem.tmdb.runtime
                    ? `${selectedItem.tmdb.runtime} min`
                    : ""}
                  {selectedItem.tmdb.number_of_seasons
                    ? ` / ${selectedItem.tmdb.number_of_seasons} seasons`
                    : ""}
                </>
              ) : (
                "N/A"
              )}
            </p>
            {/* Displays overview of the content */}
            <p>{selectedItem.tmdb.overview}</p>

            {/* Displays streaming availability in a table format */}
            {/* Table shows platform name, price information, and region availability */}
            <h3>Steaming Platforms</h3>
            {selectedItem.watchmode?.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Price</th>
                    <th>Region</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.watchmode.map((service, index) => (
                    <tr key={`${service.name}-${service.region}-${index}`}>
                      <td>
                        {/*Users can click on service name and be taken to link*/}
                        <a
                          href={service.web_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {service.name}
                        </a>
                      </td>
                      <td>{service.price || service.type}</td>
                      <td>{service.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-streaming">
                <p>no streaming information is currently available</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button varient="secondary" onClick={clearSelection}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default SearchPage;
