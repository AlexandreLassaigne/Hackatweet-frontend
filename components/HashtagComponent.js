import styles from "../styles/HashtagComponent.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Trends from "./Trends";
import Tweet from "./Tweet";
import { logout } from "../reducers/user";
import moment from "moment";

function HashtagComponent() {
  const router = useRouter();
  const { slug } = router.query;
  const user = useSelector((state) => state.user.value);
  const dispatch = useDispatch();
  const [hashtag, setHashtag] = useState("");
  const [trends, setTrends] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");

  // Fonctionnalité pour changer l'url de manière dynamique
  const likes = useSelector((state) => state.likes.value);

  useEffect(() => {
    if (slug) {
      setHashtag("#" + slug);
    } else {
      setHashtag("#");
    }
  }, [slug]);

  function searchHashtag(e) {
    const value = e.target.value.slice(1); // Supprimer le '#' du début
    setHashtag("#" + value);
    router.push(`/hashtag/${value}`, undefined, { shallow: true });
  }

  useEffect(() => {
    fetch("https://hackatweet-backend-psi-seven.vercel.app/tweets/hashtags")
      .then((response) => response.json())
      .then((data) => setTrends(data.result));
  }, []);

  useEffect(() => {
    fetch(
      "https://hackatweet-backend-psi-seven.vercel.app/tweets/searchTweet",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashtag: hashtag }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const sortedTweets = data.result.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setTweets(sortedTweets);
      });
  }, [hashtag]);

  // Mettre à jour les likes dans l'état
  const handleUpdateLikes = (tweetId, newLikes) => {
    setTweets((prevTweets) =>
      prevTweets.map((tweet) =>
        tweet._id === tweetId ? { ...tweet, like: newLikes } : tweet
      )
    );
  };

  useEffect(() => {
    if (!user.token) {
      return;
    }
    fetch(`https://hackatweet-backend-psi-seven.vercel.app/users/${user.token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setFirstName(data.firstName);
          setUsername(data.username);
        }
      });
  }, []);

  const handleClick = () => {
    dispatch(logout());
    router.push("/");
  };

  // Supprimer un tweet dans l'état
  const handleDeleteTweet = (tweetId) => {
    setTweets((prevTweets) =>
      prevTweets.filter((tweet) => tweet._id !== tweetId)
    );
  };

  const tweetsTab = tweets.map((tweet) => {
    const isLiked = likes.includes(tweet._id);
    //L'opérateur ?. s'appelle l'optional chaining (chaînage optionnel).
    // Il permet d'éviter les erreurs lorsque tu essaies d'accéder à une
    // propriété d'un objet qui pourrait être null ou undefined
    const isUser = tweet.user?.token === user?.token;
    const date = moment(tweet.date).fromNow(true);
    //Permet de mettre les hashtag en bleu
    const message = tweet.message.split(" ");
    const tweets = message.map((word, i) => {
      if (word.startsWith("#")) {
        return (
          <span key={i} style={{ color: "#3283d3" }}>
            {word}{" "}
          </span>
        );
      } else {
        return word + " ";
      }
    });
    return (
      <Tweet
        key={tweet._id}
        date={date}
        message={tweets}
        like={tweet.like.length}
        //En utilisant ?., tu dis à JavaScript :
        // "Si element.user existe, alors prends element.user.token, sinon retourne undefined sans planter."
        avatar={tweet.user?.avatar}
        firstname={tweet.user?.firstname}
        username={tweet.user?.username}
        tweetId={tweet._id}
        isLiked={isLiked}
        isUser={isUser}
        handleUpdateLikes={handleUpdateLikes}
        handleDeleteTweet={handleDeleteTweet}
      />
    );
  });

  return (
    <div className={styles.home}>
      <section className={styles.leftSection}>
        <Link href="/homepage">
          <img className={styles.leftTwitterLogo} src="/twitter.png"></img>
        </Link>
        <div className={styles.userSection}>
          <img className={styles.userLogo} src="/userIcon.png"></img>
          <div className={styles.userInfos}>
            <h3 className={styles.userFirstName}>{firstName}</h3>
            <span className={styles.username}>@{username}</span>
            <button className={styles.logout} onClick={handleClick}>
              Logout
            </button>
          </div>
        </div>
      </section>

      <section className={styles.middleSection}>
        <h2 className={styles.title}>Hashtag</h2>
        <input
          autoFocus
          value={hashtag}
          onChange={(e) => searchHashtag(e)}
          type="text"
          className={styles.input}
        ></input>
        {tweetsTab.length > 0 ? (
          <div className={styles.tweetsContainer}>{tweetsTab}</div>
        ) : (
          <div className={styles.tweetsContainer}>
            <p className={styles.noTweet}>No tweets found with {hashtag}</p>
          </div>
        )}
      </section>

      <section className={styles.rightSection}>
        <h2 className={styles.title}>Trends</h2>
        <div className={styles.trendsSection}>
          {trends.map((trend) => (
            <Trends
              key={trend.hashtag}
              hashtag={trend.hashtag}
              count={trend.count}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
export default HashtagComponent;
