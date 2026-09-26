import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { currentUserClaims } from "../lib/auth";

interface UserRow {
  userId: string;
  displayName: string;
  seenItCount: number;
  seenPartCount: number;
  interestedCount: number;
  notInterestedCount: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const me = currentUserClaims();

  useEffect(() => {
    api.listUsers().then((res) => setUsers(res.users));
  }, []);

  return (
    <table className="leaderboard">
      <thead>
        <tr>
          <th>User</th>
          <th>Seen it</th>
          <th>Seen part</th>
          <th>Interested</th>
          <th>Not interested</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => {
          const isMe = u.userId === me?.sub;
          return (
            <tr key={u.userId} className={isMe ? "leaderboard__row--me" : undefined}>
              <td>
                {u.displayName}
                {isMe && <span className="leaderboard__you-badge">you</span>}
              </td>
              <td>{u.seenItCount}</td>
              <td>{u.seenPartCount}</td>
              <td>{u.interestedCount}</td>
              <td>{u.notInterestedCount}</td>
              <td>
                {!isMe && (
                  <Link className="btn btn--outline btn--small" to={`/compare/${u.userId}`}>
                    Compare
                  </Link>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
