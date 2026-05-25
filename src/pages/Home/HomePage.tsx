import classNames from "classnames/bind";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function HomePage() {
	return <main className={cx("home-page")} />;
}
