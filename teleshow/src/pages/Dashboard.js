import React from "react";
import "../styles/Dashboard.css";
import StarRate from "../components/starRate";
import GetAverageRating from "../scripts/GetAverageRating.js";
import FetchComments from "../components/FetchComments.js";
import SetProviders from "../scripts/SetProviders.js";
import SearchWidget from "../components/SearchWidget";
import DetailModal from "../components/DetailModal";
import PlatformFilter, {
  updateSelectedPlatforms,
} from "../components/PlatformFilter";
import { getFollowedMedia } from "../API/Flask_API.js";
// Credit to JustWatch as TMDB API watch providers data source

import { redirect, useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

// Help from https://developer.themoviedb.org/reference/trending-movies
import axios from "axios";

// Help from https://www.freecodecamp.org/news/use-firebase-authentication-in-a-react-app/
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

// Help from https://react-bootstrap.netlify.app/docs/components/modal/
import Modal from "react-bootstrap/Modal";

// Help from https://www.freecodecamp.org/news/how-to-use-the-firebase-database-in-react/
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Help from https://firebase.google.com/docs/firestore/query-data/queries
import { query, where, limit } from "firebase/firestore";

// Help from https://www.rowy.io/blog/firestore-timestamp
import { serverTimestamp } from "firebase/firestore";

// Help from https://dev.to/rajatamil/firebase-v9-firestore-delete-document-using-deletedoc-5bjh
import { doc, deleteDoc } from "firebase/firestore";

// Help from https://react-bootstrap.netlify.app/docs/components/buttons/
import Button from "react-bootstrap/Button";

// Help from https://react-icons.github.io/react-icons/icons/bs/
import { BsCircleFill, BsBookmarkFill } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";

// Help from https://www.youtube.com/watch?v=91LWShFZn40

function Dashboard() {
  // "Setters" for user information -WA
  const [userID, setUserID] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const host = process.env.REACT_APP_NETWORK_HOST;

  const [currentMediaID, setCurrentMediaID] = useState(0);
  const [currentMediaType, setCurrentMediaType] = useState("");
  const STORAGE_KEY = "platform_selection";
  //enables user filters
  //Attempts to get value from session variable
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => {
    const savedPlatforms = sessionStorage.getItem(STORAGE_KEY);
    if (savedPlatforms) {
      try {
        return JSON.parse(savedPlatforms);
      } catch (err) {
        console.error("Error parsing saved platforms:", err);
      }
    }
    return ["all"]; // Default filter
  });

  // Help from https://www.rowy.io/blog/firestore-react-query
  const [tvLoading, setTvLoading] = useState(false);
  const [movieLoading, setMovieLoading] = useState(false);
  const [recommendedTv, setRecommendedTv] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);

  // Help from https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/
  const [isLightMode, setIsLightMode] = useState(false);
  const [displayMode, setDisplayMode] = useState("darkMode");

  // "Setters" for modal information -WA
  const [modalTitle, setModalTitle] = useState("");
  const [modalPoster, setModalPoster] = useState("");
  const [modalOverview, setModalOverview] = useState("");
  const [modalLanguages, setModalLanguages] = useState("");

  const [modalProvidersAds, setModalProvidersAds] = useState("");
  const [modalProvidersBuy, setModalProvidersBuy] = useState("");
  const [modalProvidersFlatrate, setModalProvidersFlatrate] = useState("");
  const [modalProvidersFree, setModalProvidersFree] = useState("");
  const [modalProvidersRent, setModalProvidersRent] = useState("");

  const [modalRating, setModalRating] = useState(0);
  const [modalAverageRating, setModalAverageRating] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const beingFiltered = selectedPlatforms.includes("all") ? false : true;

  // Used to track if an item is already in a user's watchlist -WA
  const [watchlistDuplicate, setWatchListDuplicate] = useState(true);

  useEffect(() => {
    if (isLoggedIn && userID) {
      getRecommendations();
    }
  }, [selectedPlatforms, isLoggedIn, userID]);

  // Help from https://www.youtube.com/watch?v=PGCMdiXRI6Y
  const getRecommendations = async () => {
    // Help from https://www.rowy.io/blog/firestore-react-query
    setTvLoading(true);
    setMovieLoading(true);

    // Help from https://developer.themoviedb.org/reference/tv-series-recommendations

    // Help from https://developer.themoviedb.org/reference/trending-tv
    const tvUrl = "https://api.themoviedb.org/3/trending/tv/day?language=en-US";

    // Help from https://developer.themoviedb.org/reference/movie-recommendations

    // Help from https://developer.themoviedb.org/reference/trending-movies
    const platforms = selectedPlatforms.includes("all")
      ? "all"
      : selectedPlatforms.join(",");
    const user_id = sessionStorage.getItem("userId");
    // Worked with Moses on this -William
    const response = await axios.get(`${host}user-recommendations`, {
      params: {
        user_id,
        platforms,
      },
    });

    console.log(response.data);

    const movies = randomizeRecs(response.data.movie_recs, 4);
    const tv = randomizeRecs(response.data.tv_recs, 4);

    setRecommendedMovies(movies);
    setRecommendedTv(tv);

    setTvLoading(false);
    setMovieLoading(false);
  };

  const randomizeRecs = (items, count) => {
    if (!items || items.length <= count) return items;

    //Shuffle recommendations
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Help from https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/
  const toggleLightMode = () => {
    setIsLightMode((prevMode) => !prevMode);
    isLightMode ? setDisplayMode("darkMode") : setDisplayMode("lightMode");
  };

  // Help from https://developer.themoviedb.org/docs/image-basics
  const imgPath = "https://image.tmdb.org/t/p/w500";

  // Help from https://react-bootstrap.netlify.app/docs/components/modal/
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN}`,
    },
  };

  // Help from https://www.geeksforgeeks.org/using-the-useref-hook-to-change-an-elements-style-in-react/#

  // Help from https://react-bootstrap.netlify.app/docs/components/modal/

  // Help from https://www.freecodecamp.org/news/use-firebase-authentication-in-a-react-app/
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        //console.log(user)
        //console.log(user.displayName)
        console.log("uid", uid);
        console.log("You appear to be signed in.");
        setIsLoggedIn(true);
        setDisplayName(user.displayName);
        sessionStorage.setItem("userName", user.displayName);
        setUserID(uid);

        // Help from https://www.youtube.com/watch?v=PGCMdiXRI6Y
        // // Shows media -WA

        // Help from https://stackoverflow.com/questions/68260152/firebase-auth-currentuser-is-null-at-page-load/68260898#68260898
      } else {
        console.log("You appear to be signed out.");
        setIsLoggedIn(false);
        setUserID("");
      }
    });

    // Help from https://stackoverflow.com/questions/53070970/infinite-loop-in-useeffect
  }, []);

  const navigate = useNavigate();

  const goToWatchlist = async () => {
    navigate("/watchlist");
  };

  const handleLogout = () => {
    // Help from https://www.freecodecamp.org/news/use-firebase-authentication-in-a-react-app/
    signOut(auth)
      .then(() => {
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("userName");
        navigate("/"); // Go back to login after logging out
        alert("You have logged out successfully.");
      })
      .catch((error) => {
        alert(error);
      });
  };

  // Help from https://www.geeksforgeeks.org/using-the-useref-hook-to-change-an-elements-style-in-react/#

  // Help from https://www.freecodecamp.org/news/javascript-fetch-api-for-beginners/

  const showDetails = async (id, type) => {
    let url = "";
    let providerUrl = "";

    /*
    Help from:
    - https://developer.themoviedb.org/reference/tv-series-details
    - https://developer.themoviedb.org/reference/tv-series-watch-providers
    - https://developer.themoviedb.org/reference/movie-details
    - https://developer.themoviedb.org/reference/movie-watch-providers
    (Watch provider data provided by JustWatch)
    */

    url = `https://api.themoviedb.org/3/${type}/${id}?language=en-US`;
    providerUrl = `https://api.themoviedb.org/3/${type}/${id}/watch/providers`;

    let mediaID = 0;

    await fetch(url, options)
      .then((res) => res.json())
      .then((json) => {
        console.log(json);
        if (type === "tv") {
          setModalTitle(json.name);
        } else {
          setModalTitle(json.title);
        }
        setModalOverview(json.overview);
        setModalPoster(imgPath + json.poster_path);

        mediaID = json.id;

        // Help from https://www.w3schools.com/jsref/jsref_join.asp
        let languageArray = [];
        for (let i = 0; i < json.spoken_languages.length; i++) {
          languageArray.push(json.spoken_languages[i].name);
        }
        setModalLanguages(languageArray.join(", "));
      })
      .catch((err) => console.error(err));

    await fetch(providerUrl, options)
      .then((res) => res.json())
      .then(async (json) => {
        console.log(json);
        console.log("Providers:", json.results);
        console.log("Providers:", Object.keys(json.results).length);

        // Help from https://www.freecodecamp.org/news/check-if-an-object-is-empty-in-javascript/
        console.log(Object.keys(json.results).length);

        // Help from https://www.freecodecamp.org/news/check-if-an-object-is-empty-in-javascript/
        if (Object.keys(json.results).length) {
          setModalProvidersAds(await SetProviders(json.results.US.ads));
          setModalProvidersBuy(await SetProviders(json.results.US.buy));
          setModalProvidersFlatrate(
            await SetProviders(json.results.US.flatrate)
          );
          setModalProvidersFree(await SetProviders(json.results.US.free));
          setModalProvidersRent(await SetProviders(json.results.US.rent));
        } else {
          setModalProvidersAds("");
          setModalProvidersBuy("");
          setModalProvidersFlatrate("");
          setModalProvidersFree("");
          setModalProvidersRent("");
        }
      })
      .catch((err) => {
        console.error(err);
        setModalProvidersAds("");
        setModalProvidersBuy("");
        setModalProvidersFlatrate("");
        setModalProvidersFree("");
        setModalProvidersRent("");
      });

    setCurrentMediaType(type);
    setCurrentMediaID(mediaID);

    //console.log("Media ID: ", mediaID)

    setModalRating(0);
    setModalAverageRating(0);
    const ratingRef = collection(db, "Ratings");
    const ratingSnapshot = await getDocs(
      query(
        ratingRef,
        where("user_id", "==", userID),
        where("media_id", "==", mediaID)
      )
    );
    ratingSnapshot.forEach((rating) => {
      console.log("Rating: ", rating.data());
      if (
        rating.data().media_id === mediaID &&
        rating.data().user_id === userID
      ) {
        setModalRating(rating.data().rating);
      } else {
        setModalRating(0);
      }
    });

    // Updating avgRating
    setModalAverageRating(await GetAverageRating(mediaID, type));

    // Help from https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
    const watchlistRef = collection(db, "Watchlist");
    const checkForDuplicates = query(
      watchlistRef,
      where("user_id", "==", userID),
      where("media_id", "==", mediaID),
      where("type", "==", type)
    );
    const querySnapshot = await getDocs(checkForDuplicates);
    let duplicates = 0; // This will check for duplicate userID / media ID combinations
    querySnapshot.forEach((doc) => {
      duplicates++;
    });
    //console.log(currentMediaID)
    console.log(duplicates);
    if (duplicates > 0) {
      setWatchListDuplicate(true);
    } else {
      setWatchListDuplicate(false);
    }

    // Help from https://www.geeksforgeeks.org/how-to-use-modal-component-in-reactjs/#
    // And https://react-bootstrap.netlify.app/docs/components/modal/
    handleShow();
  };

  // Help from https://www.freecodecamp.org/news/how-to-use-the-firebase-database-in-react/
  // And https://firebase.google.com/docs/firestore/query-data/queries#node.js_2
  // Adding media to watchlist
  const addToWatchlist = async (e) => {
    e.preventDefault();

    // Help from https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
    const watchlistRef = collection(db, "Watchlist");
    const checkForDuplicates = query(
      watchlistRef,
      where("user_id", "==", userID),
      where("media_id", "==", currentMediaID),
      where("type", "==", currentMediaType)
    );
    const querySnapshot = await getDocs(checkForDuplicates);
    let duplicates = 0; // This will check for duplicate userID / media ID combinations
    querySnapshot.forEach((doc) => {
      duplicates++;
    });
    if (duplicates > 0) {
      alert("You already have this in your watchlist.");
    } else {
      try {
        const docRef = await addDoc(collection(db, "Watchlist"), {
          user_id: userID,
          title: modalTitle,
          type: currentMediaType,
          media_id: currentMediaID,
          status: "Plan to watch",

          // Help from https://www.rowy.io/blog/firestore-timestamp
          date_added: serverTimestamp(),

          poster_path: modalPoster,
        });
        console.log("Wrote document with ID: ", docRef.id);
        alert("Item added to watchlist successfully.");
        setWatchListDuplicate(true);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
  };

  const removeFromWatchlist = async (e) => {
    e.preventDefault();

    let idToDelete = 0;

    // Help from https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
    const watchlistRef = collection(db, "Watchlist");
    const q = query(
      watchlistRef,
      where("user_id", "==", userID),
      where("media_id", "==", currentMediaID),
      where("type", "==", currentMediaType)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      //console.log(doc.data())
      //console.log(doc.data().title);
      //console.log(doc.id)
      idToDelete = doc.id;
    });

    // Help from https://dev.to/rajatamil/firebase-v9-firestore-delete-document-using-deletedoc-5bjh
    await deleteDoc(doc(db, "Watchlist", idToDelete))
      .then(() => {
        console.log("Document deleted successfully.");
        alert("Item removed from watchlist successfully.");
        setWatchListDuplicate(false);
      })
      .catch((error) => {
        console.log(error);
        alert(error);
      });
  };
  const handleItemClick = (item) => {
    console.log("item clicked", item);
    if (item.title) {
      item.media_type = "movie";
    } else {
      item.media_type = "tv";
    }
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setShowModal(false);
  };

  return (
    // Help from https://www.geeksforgeeks.org/using-the-useref-hook-to-change-an-elements-style-in-react/#
    <div
      className={`container ${
        isLightMode ? "dashboard-light" : "dashboard-dark"
      }`}
      id="dashboard"
    >
      <h2>Dashboard in Progress Stay Tuned</h2>
      <div>
        {/* Help from https://stackoverflow.com/questions/76990183/how-to-display-the-current-user-display-name-in-firebase-using-react */}
        {isLoggedIn ? (
          <>
            <p>Welcome, {displayName || "none"}! </p>

            {/*<div>
          { Help from https://www.geeksforgeeks.org/using-the-useref-hook-to-change-an-elements-style-in-react/# }
          <Button onClick={changeDisplayMode} variant={`${darkMode ? "light" : "dark"}`}>Switch to {darkMode ? "Light" : "Dark"} Mode</Button>
          <Button variant="danger" onClick={handleLogout}>Log out</Button>
        </div>*/}

            <div className="centerBar">
              {/* Help from https://react-icons.github.io/react-icons/icons/bs/ */}
              <BsCircleFill
                style={{ fontSize: "48px", cursor: "pointer", float: "left" }}
                onClick={() =>
                  alert(
                    "Profile functionality has not yet been fully implemented. We thank you for your patience."
                  )
                }
              />
              {/*<Button variant="secondary" style={{width: "60%", textAlign: "left", fontSize: "24px"}} onClick={() => alert("Search functionality has not yet been implemented.")}>Search...</Button>*/}
              <SearchWidget lightMode={!!isLightMode} />{" "}
              {/*Moses' Search Widget*/}
              {/* Help from https://react-icons.github.io/react-icons/icons/bs/ */}
              <BsBookmarkFill
                style={{ fontSize: "48px", cursor: "pointer", float: "right" }}
                onClick={goToWatchlist}
              />
              <IoMdSettings
                style={{ fontSize: "48px", cursor: "pointer", float: "right" }}
                onClick={() => navigate("/settings")}
              />
            </div>
            <br />
            <br />

            {/*<button onClick={goToWatchlist}>Go to Watchlist</button>*/}
          </>
        ) : (
          <>
            <p>You are currently logged out.</p>
            <Button variant="primary" onClick={() => navigate("/")}>
              Return to Login
            </Button>
          </>
        )}

        {/* Help from https://react-bootstrap.netlify.app/docs/components/modal/ */}
        {/* And https://github.com/react-bootstrap/react-bootstrap/issues/3794 */}
        {/* And https://www.geeksforgeeks.org/how-to-use-modal-component-in-reactjs/# */}
        <Modal
          show={show}
          onHide={handleClose}
          dialogClassName="modal-85w"
          backdrop="static"
          keyboard={false}
        >
          {/* Help from https://stackoverflow.com/questions/76810663/react-modals-or-dialogs-doesnt-inherit-the-dark-mode-styles-tailwind */}
          {/* And https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/# */}
          <Modal.Header
            closeButton
            className={`${isLightMode ? "head-light" : "head-dark"}`}
          >
            <Modal.Title>{modalTitle || "None"}</Modal.Title>
          </Modal.Header>

          {/* Help from https://stackoverflow.com/questions/76810663/react-modals-or-dialogs-doesnt-inherit-the-dark-mode-styles-tailwind */}
          {/* And https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/# */}
          <Modal.Body
            className={`modalBody ${isLightMode ? "body-light" : "body-dark"}`}
          >
            <div className="modalBox">
              <div className="modalLeft">
                <img
                  className="modalPoster"
                  id="modalPoster"
                  src={modalPoster}
                  alt="modal poster"
                />
                {!watchlistDuplicate ? (
                  <button
                    className="watchlist-button primary"
                    onClick={addToWatchlist}
                  >
                    Add to Watchlist
                  </button>
                ) : (
                  <button
                    className="watchlist-button primary"
                    onClick={removeFromWatchlist}
                  >
                    Remove from Watchlist
                  </button>
                )}
                <button
                  className="watchlist-button secondary"
                  onClick={() =>
                    alert(
                      "Review functionality has not been implemented yet. We thank you for your patience."
                    )
                  }
                >
                  Write a Review
                </button>
                <p>Leave a Rating:</p>

                {/* Help from https://stackoverflow.com/questions/70344255/react-js-passing-one-components-variables-to-another-component-and-vice-versa */}
                <StarRate
                  userID={userID}
                  currentMediaID={currentMediaID}
                  currentMediaType={currentMediaType}
                  initialRate={modalRating}
                  initialAvgRate={modalAverageRating}
                ></StarRate>
              </div>

              <div className="modalRight">
                <h2>Overview</h2>
                <div id="overviewBox">{modalOverview || "None"}</div>
                <hr />
                {/*<h3>Average Rating: { modalAverageRating || 0 }/5</h3>
                <hr /> Commented out until average rating updates is implemented */}
                <h3>Spoken Languages</h3>
                {modalLanguages || "None"}
                <hr />

                {/* Help from https://www.geeksforgeeks.org/how-to-perform-form-validation-in-react/ */}
                <FetchComments
                  userID={userID}
                  mediaId={currentMediaID}
                  mediaType={currentMediaType}
                  displayName={displayName}
                  displayMode={displayMode}
                />
              </div>
            </div>
          </Modal.Body>
        </Modal>

        {isLoggedIn ? (
          <>
            {/* Help from https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_responsive2 */}
            <h4>{`Recommended TV ${beingFiltered ? "(Filtered) " : " "}`}:</h4>

            {/* Help from https://www.rowy.io/blog/firestore-react-query */}
            {/* And https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key */}

            {/* Help from https://www.youtube.com/watch?v=PGCMdiXRI6Y */}
            {/* And https://www.rowy.io/blog/firestore-react-query */}
            {tvLoading && (
              <div className="loading-container">
                <Spinner animation="border" role="status" variant="light">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}

            <div className="mediaBox">
              {recommendedTv &&
                recommendedTv?.map((tv) => (
                  <div key={tv.id} className="mediaCell">
                    {/* Help from https://stackoverflow.com/questions/29810914/react-js-onclick-cant-pass-value-to-method and https://upmostly.com/tutorials/pass-a-parameter-through-onclick-in-react */}
                    <img
                      className="mediaPoster"
                      src={imgPath + tv.poster_path}
                      alt="media"
                      onClick={() => handleItemClick(tv)}
                    />
                    <p>{tv.name}</p>
                  </div>
                ))}
            </div>

            <h4>{`Recommended Movies ${
              beingFiltered ? "(Filtered) " : " "
            }:`}</h4>
            {movieLoading && (
              <div className="loading-container">
                <Spinner animation="border" role="status" variant="light">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            <div className="mediaBox">
              {recommendedMovies &&
                recommendedMovies?.map((movie) => (
                  <div key={movie.id} className="mediaCell">
                    {/* Help from https://stackoverflow.com/questions/29810914/react-js-onclick-cant-pass-value-to-method and https://upmostly.com/tutorials/pass-a-parameter-through-onclick-in-react */}
                    <img
                      className="mediaPoster"
                      src={imgPath + movie.poster_path}
                      alt="media"
                      onClick={() => handleItemClick(movie)}
                    />
                    <p>{movie.title}</p>
                  </div>
                ))}
            </div>

            <div>
              {/* Help from https://www.geeksforgeeks.org/using-the-useref-hook-to-change-an-elements-style-in-react/# */}
              <Button variant="primary" onClick={() => navigate("/")}>
                Home Page
              </Button>
              <Button
                onClick={toggleLightMode}
                variant={`${isLightMode ? "dark" : "light"}`}
              >
                Switch to {isLightMode ? "Dark" : "Light"} Mode
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </>
        ) : (
          ""
        )}

        {/* Help from https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_responsive2 */}
        {/*<h4>Recommended TV (Based on Breaking Bad):</h4>*/}

        {/* Help from https://www.rowy.io/blog/firestore-react-query */}
        {/* And https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key */}
        {/* Loading could go here */}
      </div>
      {selectedItem && showModal && (
        <DetailModal
          mediaId={selectedItem.id}
          mediaType={selectedItem.media_type}
          show={showModal}
          onHide={handleCloseModal}
        />
      )}
    </div>
  );
}

export default Dashboard;

/*

Other Resources used/referred to:
- https://www.freecodecamp.org/news/javascript-fetch-api-for-beginners/
- https://www.geeksforgeeks.org/how-to-keep-a-mutable-variable-in-react-useref-hook/
- https://www.w3schools.com/react/react_render.asp
- https://stackoverflow.com/questions/76990183/how-to-display-the-current-user-display-name-in-firebase-using-react
- https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
- https://www.rowy.io/blog/firestore-react-query
- https://stackoverflow.com/questions/49873223/why-does-my-firebase-onauthstatechanged-trigger-multiple-times-react-native
- https://cloud.google.com/blog/products/databases/aggregate-with-sum-and-avg-in-firestore
- https://nithinkvarrier.medium.com/sum-and-average-in-firestore-leverage-getaggregatefromserver-in-the-latest-update-november-2023-06fd10f92347
- https://firebase.google.com/docs/firestore/query-data/indexing 
- https://www.geeksforgeeks.org/using-the-useref-hook-to-change-an-elements-style-in-react/#

- https://stackoverflow.com/questions/29810914/react-js-onclick-cant-pass-value-to-method
- https://upmostly.com/tutorials/pass-a-parameter-through-onclick-in-react

*/
