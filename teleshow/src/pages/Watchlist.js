import React from "react";
import '../styles/Dashboard.css'
import '../styles/Watchlist.css'
import GetAverageRating from "../scripts/GetAverageRating.js";
import SetProviders from "../scripts/SetProviders.js"

import StarRate from "../components/starRate";
import FetchComments from "../components/FetchComments.js"


// Credit to JustWatch as TMDB API watch providers data source

// Help from https://developer.themoviedb.org/reference/tv-series-details 
// and https://developer.themoviedb.org/reference/movie-details
import axios from 'axios';

import { useNavigate } from "react-router-dom";

// Help from https://www.freecodecamp.org/news/use-firebase-authentication-in-a-react-app/
import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from '../firebase'

// Help from https://react-bootstrap.netlify.app/docs/components/modal/
import Modal from 'react-bootstrap/Modal'

// Help from https://www.freecodecamp.org/news/how-to-use-the-firebase-database-in-react/
import {collection, addDoc, getDocs, serverTimestamp} from "firebase/firestore";
import { db } from "../firebase";

// Help from https://firebase.google.com/docs/firestore/query-data/queries
import { query, where } from "firebase/firestore";

// Help from https://dev.to/rajatamil/firebase-v9-firestore-delete-document-using-deletedoc-5bjh
import { doc, deleteDoc } from "firebase/firestore";

// Help from https://react-bootstrap.netlify.app/docs/components/buttons/
import Button from 'react-bootstrap/Button';

// Help from https://react-bootstrap.netlify.app/docs/forms/select/
import Form from 'react-bootstrap/Form';

// Help from https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
import { updateDoc } from "firebase/firestore";

// Help from https://react-bootstrap.netlify.app/docs/components/button-group/
import ButtonGroup from 'react-bootstrap/ButtonGroup'

// Help from https://www.youtube.com/watch?v=91LWShFZn40
import { getAggregateFromServer, average } from "firebase/firestore";

function Watchlist() {

    const [loggedIn, setLoggedIn] = useState(false)
    const [userID, setUserID] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [currentMediaID, setCurrentMediaID] = useState(0)
    const [currentMediaType, setCurrentMediaType] = useState("")

    // Copied from Dashboard.js
    const [modalTitle, setModalTitle] = useState("")
    const [modalPoster, setModalPoster] = useState("")
    const [modalOverview, setModalOverview] = useState("")
    const [modalLanguages, setModalLanguages] = useState("")

    const [modalProvidersAds, setModalProvidersAds] = useState("")
    const [modalProvidersBuy, setModalProvidersBuy] = useState("")
    const [modalProvidersFlatrate, setModalProvidersFlatrate] = useState("")
    const [modalProvidersRent, setModalProvidersRent] = useState("")

    // Help from https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/
    const [isLightMode, setIsLightMode] = useState(false)
    const [displayMode, setDisplayMode] = useState("darkMode")

    // Help from https://www.rowy.io/blog/firestore-react-query
    const [loading, setLoading] = useState(false)
    const [watchlist, setWatchlist] = useState([])

    const [reviewDuplicate, setReviewDuplicate] = useState(true);
    const [reviewID, setReviewID] = useState(null);

    // Help from https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/
    const toggleLightMode = () => {
        setIsLightMode((prevMode) => !prevMode);
        isLightMode ? setDisplayMode("darkMode") : setDisplayMode("lightMode")
    }

    // Help from https://developer.themoviedb.org/docs/image-basics
    const imgPath = "https://image.tmdb.org/t/p/w500"

    // Help from https://react-bootstrap.netlify.app/docs/components/modal/
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const[review,setReview] = useState(false);
    const handleReview= () => setReview(true);
    const handleReviewClose = () => setReview(false);

    // State to hold review textarea value
    const [reviewText, setReviewText] = useState("");


    // Help from https://www.rowy.io/blog/firestore-react-query
    const queryWatchlist = async (uid) => {
        const watchlistRef = collection(db, "Watchlist")
        const q = query(watchlistRef, where('user_id', '==', uid))
        const querySnapshot = await getDocs(q)
        const res = []
        querySnapshot.forEach(item => {
            //console.log("Item Data:", item.data())
            res.push({
                id: item.id,
                ...item.data()
            })
        })

        console.log("res:", res);
        for (let i = 0; i < res.length; i++) {
            let snap = await getDocs(query(collection(db, "Ratings"), where('user_id', '==', res[i].user_id), where('media_id', '==', res[i].media_id)))
            let rating = 0;
            let avgRating = 0;
            snap.forEach(thing => {
                console.log("Snap item: ", thing.data());
                console.log("rating:", thing.data().rating)
                rating = thing.data().rating
                avgRating = 0;
            })
            res[i].rating = rating
            console.log("Res item:", res[i]);
            res[i].averageRating = await GetAverageRating(res[i].media_id, res[i].type)
        }

        return res
    }

    const fetchWatchlist = async (uid) => {
        setLoading(true)
        const res = await queryWatchlist(uid)
        setWatchlist([...res])
        setLoading(false)
    }


    // Help from https://www.freecodecamp.org/news/use-firebase-authentication-in-a-react-app/
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                console.log("uid", uid)
                setLoggedIn(true)
                setUserID(uid)
                setDisplayName(user.displayName)
                // Help from https://stackoverflow.com/questions/68260152/firebase-auth-currentuser-is-null-at-page-load/68260898#68260898
                fetchWatchlist(uid)
            } else {
                console.log("You are currently logged out.");
                setLoggedIn(false)
                setUserID("")
            }
        })

        // Help from https://www.rowy.io/blog/firestore-react-query
        //fetchWatchlist()

        // Help from https://stackoverflow.com/questions/53070970/infinite-loop-in-useeffect
    }, [])

    const removeFromWatchlist = async (id, type) => {
        let idToDelete = 0;
        
        // Help from https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
        const watchlistRef = collection(db, "Watchlist");
        const q = query(watchlistRef, where('user_id', '==', userID), where('media_id', '==', id), where('type', '==', type));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            idToDelete = doc.id
        })
        
        // Help from https://dev.to/rajatamil/firebase-v9-firestore-delete-document-using-deletedoc-5bjh
        await deleteDoc(doc(db, "Watchlist", idToDelete))
        .then(() => {
            console.log("Document deleted successfully.")
            alert("Item removed from watchlist successfully.");
            fetchWatchlist(userID) // Resets the watchlist display to reflect the deleted item - WA
        })
        .catch(error => {
            console.log(error);
            alert(error);
        })
    }

    const displayInformation = async (id, type) => {

        // Help from https://developer.themoviedb.org/reference/tv-series-details 
        // and https://developer.themoviedb.org/reference/movie-details
        const options = {
            method: 'GET',
            url: `https://api.themoviedb.org/3/${type}/${id}?language=en-US`,
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN}`
            }
        };

        // Help from https://developer.themoviedb.org/reference/tv-series-watch-providers
        // and https://developer.themoviedb.org/reference/movie-watch-providers
        // (TMDB API data provided by JustWatch)
        const providerOptions = {
            method: 'GET',
            url: `https://api.themoviedb.org/3/${type}/${id}/watch/providers`,
            headers: {
                accept: 'application.json',
                Authorization: `Bearer ${process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN}`
            }
        }

        setCurrentMediaID(id)
        setCurrentMediaType(type)

        // Help from https://developer.themoviedb.org/reference/tv-series-details 
        // and https://developer.themoviedb.org/reference/movie-details
        await axios.request(options)
            .then(res => {
                console.log(res.data)
                if (type === "tv") {
                    setModalTitle(res.data.name)
                } else {
                    setModalTitle(res.data.title)
                }
                setModalOverview(res.data.overview)
                setModalPoster(imgPath + res.data.poster_path)

                // Help from https://www.w3schools.com/jsref/jsref_join.asp
                // Copied from Dashboard.js
                let languageArray = []
                for(let i = 0; i < res.data.spoken_languages.length; i++) {
                    languageArray.push(res.data.spoken_languages[i].name)
                }
                setModalLanguages(languageArray.join(", "))
            })
            .catch(err => console.error(err))
        
        
        // Help from https://developer.themoviedb.org/reference/tv-series-watch-providers
        // and https://developer.themoviedb.org/reference/movie-watch-providers
        // (TMDB API data provided by JustWatch)
        await axios.request(providerOptions)
            .then(async res => {
                console.log(res.data)

                // Help from https://www.freecodecamp.org/news/check-if-an-object-is-empty-in-javascript/
                if (Object.keys(res.data.results).length) {
                    setModalProvidersAds(await SetProviders(res.data.results.US.ads))
                    setModalProvidersBuy(await SetProviders(res.data.results.US.buy))
                    setModalProvidersFlatrate(await SetProviders(res.data.results.US.flatrate))
                    setModalProvidersRent(await SetProviders(res.data.results.US.rent))
                } else {
                    setModalProvidersAds("")
                    setModalProvidersBuy("")
                    setModalProvidersFlatrate("")
                    setModalProvidersRent("")
                }
            })
            .catch(err => {
                console.error(err)
                setModalProvidersBuy("")
                setModalProvidersFlatrate("")
                setModalProvidersRent("")
            })

        // Help from https://www.geeksforgeeks.org/how-to-use-modal-component-in-reactjs/#
        // And https://react-bootstrap.netlify.app/docs/components/modal/
        handleShow()
    }

   const displayReviewModal = async (id, type) => {

        setCurrentMediaID(id)
       setCurrentMediaType(type)

       const options = {
           method: 'GET',
           url: `https://api.themoviedb.org/3/${type}/${id}?language=en-US`,
           headers: {
               accept: 'application/json',
               Authorization: `Bearer ${process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN}`
           }
       };

       // Help from https://developer.themoviedb.org/reference/tv-series-watch-providers
       // and https://developer.themoviedb.org/reference/movie-watch-providers
       // (TMDB API data provided by JustWatch)
       const providerOptions = {
           method: 'GET',
           url: `https://api.themoviedb.org/3/${type}/${id}/watch/providers`,
           headers: {
               accept: 'application.json',
               Authorization: `Bearer ${process.env.REACT_APP_TMDB_READ_ACCESS_TOKEN}`
           }
       }

       //Check if review exists
       const reviewRef = collection(db, "Reviews")
       const q = query(reviewRef, where("user_id", "==", userID), where("media_id", "==", id))
       const querySnapshot = await getDocs(q)

       if (!querySnapshot.empty) {
           const existingReview = querySnapshot.docs[0].data()
           setReviewText(existingReview.review)
           setReviewID(querySnapshot.docs[0].id)
       } else {
           setReviewText("")
           setReviewID(null)
       }

       await axios.request(options)
           .then(res => {
               console.log(res.data)
               if (type === "tv") {
                   setModalTitle(res.data.name)
               } else {
                   setModalTitle(res.data.title)
               }
               setModalOverview(res.data.overview)
               setModalPoster(imgPath + res.data.poster_path)

               // Help from https://www.w3schools.com/jsref/jsref_join.asp
               // Copied from Dashboard.js
               let languageArray = []
               for(let i = 0; i < res.data.spoken_languages.length; i++) {
                   languageArray.push(res.data.spoken_languages[i].name)
               }
               setModalLanguages(languageArray.join(", "))
           })
           .catch(err => console.error(err))


       handleReview()
   }

    // From FetchComments.js, handle change in textarea
    const handleReviewChange = (e) => {
        setReviewText(e.target.value);
        const { name, value } = e.target;
        setReviewData({
            ...reviewData,
            [name]: value,
        })
    };


    // Submit review to Firestore
    const handleReviewSubmit = async (e, currentMediaID, currentMediaType) => {
        e.preventDefault()

        if (reviewText.trim() === "") {
            alert("Review cannot be empty!")
            return
        }

        try {
            if (reviewID) {
                // Update existing review
                const reviewRef = doc(db, "Reviews", reviewID)
                await updateDoc(reviewRef, {
                    review: reviewText,
                    date_added: serverTimestamp(),
                })
                alert("Review updated successfully!")
            } else {
                // Add a new review if no previous review exists
                const reviewRef = await addDoc(collection(db, "Reviews"), {
                    user_id: userID,
                    title: modalTitle,
                    media_type: currentMediaType,
                    media_id: currentMediaID,
                    review: reviewText,
                    date_added: serverTimestamp(),
                })
                console.log("Review added with ID: ", reviewRef.id)
                alert("Review submitted successfully!")
            }

            // Clear textarea and reset after submission
            setReviewText("")
            setReviewID(null)
        } catch (error) {
            alert("Error submitting review. Please try again.")
        }
    };

    const updateStatus = async (id, watchStatus) => {
        // Help from https://firebase.google.com/docs/firestore/manage-data/add-data
        // And https://www.geeksforgeeks.org/writing-and-reading-data-in-cloud-firestore/
        // And https://www.geeksforgeeks.org/react-bootstrap-select/
        const watchlistRef = doc(db, "Watchlist", id)
        await updateDoc(watchlistRef, {
            status: watchStatus
        });
    }

    const returnToDashboard = () => {
        navigate("/dashboard")
    }


    //From FetchComments.js
    const [reviewData, setReviewData] = useState({
        text: '',
        remainingCharacters: 5000,
    })


    // From Dashboard.js
    const navigate = useNavigate();

    return (
        <div className={`container ${isLightMode ? "watchlistLight" : "watchlistDark" }`} id="watchlistContainer">

            {/* Help from https://react-bootstrap.netlify.app/docs/components/modal/ */}
            {/* And https://github.com/react-bootstrap/react-bootstrap/issues/3794 */}
            {/* And https://www.geeksforgeeks.org/how-to-use-modal-component-in-reactjs/# */}
            {/* Copied from Dashboard.js */}
            <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} dialogClassName="modal-85w">

                {/* Help from https://stackoverflow.com/questions/76810663/react-modals-or-dialogs-doesnt-inherit-the-dark-mode-styles-tailwind */}
                {/* And https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/# */}
                <Modal.Header className={`${isLightMode ? 'head-light' : 'head-dark'}`} closeButton>
                    <Modal.Title>
                        { modalTitle || "None" }
                    </Modal.Title>
                </Modal.Header>


                {/* Help from https://stackoverflow.com/questions/76810663/react-modals-or-dialogs-doesnt-inherit-the-dark-mode-styles-tailwind */}
                {/* And https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/# */}
                <Modal.Body className={`modalBody ${isLightMode ? 'body-light' : 'body-dark'}`}>
                    <div className="modalBox">
                        <div className="modalLeft">
                            <img className="modalPoster" id="modalPoster" src={modalPoster} alt="modal poster" />
                        </div>
                        <div className="modalRight">
                        <h2>Overview</h2>
                        <div id="overviewBox">
                            { modalOverview || "None" }
                        </div>
                        <hr />

                        <h3>Spoken Languages</h3>
                            { modalLanguages || "None" }
                        <hr />

                        <h3>Watch Providers</h3>

                        { modalProvidersAds ?
                            <>
                                <h4>Ads</h4>
                                {modalProvidersAds}
                            </> : ""
                        }

                        {
                            modalProvidersBuy ?
                            <>
                                <h4>Buy</h4>
                                {modalProvidersBuy}
                            </> : ""
                        }

                        {
                            modalProvidersFlatrate ?
                            <>
                                <h4>Flatrate</h4>
                                {modalProvidersFlatrate}
                            </> : ""
                        }

                        {
                            modalProvidersRent ?
                            <>
                                <h4>Rent</h4>
                                {modalProvidersRent}
                            </> : ""
                        }

                        <hr />
                        {/* Help from https://www.geeksforgeeks.org/how-to-perform-form-validation-in-react/ */}
                        <FetchComments
                        userID={userID}
                        mediaId={currentMediaID}
                        mediaType={currentMediaType}
                        displayName={displayName}
                        displayMode={displayMode} />
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* review modal */}
            <Modal show={review} onHide={handleReviewClose} backdrop="static" keyboard={false} dialogClassName="modal-85w">

                {/* Help from https://stackoverflow.com/questions/76810663/react-modals-or-dialogs-doesnt-inherit-the-dark-mode-styles-tailwind */}
                {/* And https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/# */}
                <Modal.Header className={`${isLightMode ? 'head-light' : 'head-dark'}`} closeButton>
                    <Modal.Title>
                        { modalTitle || "None" }
                    </Modal.Title>
                </Modal.Header>


                {/* Help from https://stackoverflow.com/questions/76810663/react-modals-or-dialogs-doesnt-inherit-the-dark-mode-styles-tailwind */}
                {/* And https://www.geeksforgeeks.org/how-to-create-dark-light-theme-in-bootstrap-with-react/# */}
                <Modal.Body className={`modalBody ${isLightMode ? 'body-light' : 'body-dark'}`}>
                    <div className="modalBox">
                        <div className="modalLeft">
                        </div>
                        <div className="modalRight">
                            <h2>Write a Review</h2>
                            <form onSubmit ={(e)=> handleReviewSubmit(e, currentMediaID, currentMediaType)}>
                            <textarea
                                className={`commentTextBox ${displayMode==="lightMode" ? "textBox-light" : "textBox-dark" }`}
                                rows={5}
                                placeholder="Add a Review..."
                                name="text"
                                value={reviewText}
                                onChange={handleReviewChange}
                                maxLength={5000} />
                            { `${reviewData.remainingCharacters - reviewData.text.length} characters remaining.` }

                            <button className="watchlist-button secondary" type="submit" onClick={handleReviewClose}>Submit</button>
                        </form>


                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <div className="watchlistBox">
                <div className="watchlistLeft">

                    <h2>Watchlist in progress stay tuned</h2>
                    { loggedIn ? "Logged in" : "Logged out" }<br /><br />

                    
                    {/* Help from https://react-bootstrap.netlify.app/docs/components/buttons/ */}
                    {/* And https://www.geeksforgeeks.org/how-to-change-button-text-on-click-in-reactjs/# */}
                    <Button variant={`${isLightMode ? "dark" : "light" }`} onClick={toggleLightMode}>
                        { `Switch to ${isLightMode ? "Dark" : "Light" } Mode` }
                    </Button>
                    <br /><br />
                    <Button variant="primary" onClick={returnToDashboard}>
                        Return to Dashboard
                    </Button>
                    

                    
                </div>
                <div className="watchlistRight">
                    <h1 className="watchlistHeader" style={{textAlign: "center"}}>Your Watchlist</h1><br />
                    <div id="watchlist" className="watchlist">
                        {/* Help from https://www.rowy.io/blog/firestore-react-query */}
                        {/* And https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key */}
                        { loading && <p>Loading...</p> }
                        { watchlist.length > 0 && watchlist.map(item => (
                            <div className={`watchlistItem ${isLightMode ? "watchlistItemLight" : "watchlistItemDark"}`} key={item.id}>
                                <div className="watchlistPoster">
                                    <img src={item.poster_path} className="watchlistPosterImg" alt="watchlist item poster" />
                                </div>
                                <div className="watchlistContent">
                                    <h3>{item.title}</h3>

                                    {/* Help from https://stackoverflow.com/questions/52247445/how-do-i-convert-a-firestore-date-timestamp-to-a-js-date */}
                                    <p>Date Added: { item.date_added.toDate().toDateString() }</p>

                                    {/* Help from https://react.dev/reference/react-dom/components/select */}
                                    {/* And https://react-bootstrap.netlify.app/docs/forms/select/ */}
                                    {/* And https://www.geeksforgeeks.org/react-bootstrap-select/ */}
                                    Status:
                                    <Form.Select data-bs-theme={`${isLightMode ? "light" : "dark"}`} style={{width: "90%"}} defaultValue={item.status} name="watchStatus"
                                    // Help from https://stackoverflow.com/questions/61858177/how-can-i-get-the-value-from-react-bootstrap-form-select
                                    onChange={e => updateStatus(item.id, e.target.value)}
                                    >
                                        <option value="Plan to watch">Plan to watch</option>
                                        <option value="Currently watching">Currently watching</option>
                                        <option value="On hold">On hold</option>
                                        <option value="Stopped watching">Stopped watching</option>
                                        <option value="Finished watching">Finished watching</option>
                                    </Form.Select>



                                    <ButtonGroup>
                                        <Button variant="primary" onClick={() => displayInformation(item.media_id, item.type)}>View Information</Button>
                                        <Button variant="success" onClick={() => displayReviewModal(item.media_id,item.type)}>Write a Review</Button>
                                        <Button variant="danger" onClick={() => removeFromWatchlist(item.media_id, item.type)}>Remove from Watchlist</Button>
                                    </ButtonGroup>
                                    <br/>
                                    <p>Your rating:</p>

                                    {/* Help from https://stackoverflow.com/questions/70344255/react-js-passing-one-components-variables-to-another-component-and-vice-versa */}
                                    <StarRate
                                    userID={userID}
                                    currentMediaID={item.media_id}
                                    currentMediaType={item.type}
                                    initialRate={item.rating}
                                    initialAvgRate={item.averageRating}>

                                    </StarRate>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default Watchlist;

/* 

Other Resources Used:
- https://www.geeksforgeeks.org/how-to-change-button-text-on-click-in-reactjs/#
- https://stackoverflow.com/questions/70636194/cant-make-firestore-to-get-only-docs-from-logged-user-id 
- https://stackoverflow.com/questions/72962388/fetched-firestore-data-not-displaying-on-first-page-load-with-react-useeffect 
- https://stackoverflow.com/questions/66752231/firebase-reactjs-useeffect-typeerror-cannot-read-property-uid-of-null 
- https://stackoverflow.com/questions/72962388/fetched-firestore-data-not-displaying-on-first-page-load-with-react-useeffect 
- https://stackoverflow.com/questions/71256127/how-can-i-retrieve-a-user-id-from-firestore-via-flask-backend-react-frontend/72785157 
- https://react-bootstrap.netlify.app/docs/getting-started/color-modes/ 

*/