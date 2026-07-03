import React from "react";

const rules = [
  {
    title: "🏓 Legal Serve",
    points: [
      "The ball must be tossed at least 6 inches from an open palm and struck behind the end line.",
      "The ball must bounce once on the server's side, pass over the net, and then bounce on the receiver's side.",
      "For singles, the serve may land anywhere on the opponent's side of the table.",
    ],
    subPoints: [
      {
        title: "Contact",
        text: "Strike the ball on its way down from behind the end line.",
      },
      {
        title: "The Bounce",
        text: "The ball must first bounce on your side, cross the net, and then bounce on your opponent's side.",
      },
      {
        title: "Let",
        text: 'If the serve touches the net but lands correctly, it is called a "Let" and the serve is replayed.',
      },
    ],
  },
  {
    title: "🔄 Switching Ends & Serve",
    points: [
      "The serve changes every 2 points.",
      "Players switch sides after each game.",
      "Players also switch sides when either player reaches 5 points.",
    ],
  },
  {
    title: "⚖️ Deuce",
    points: [
      "If the score reaches 10–10, the game restarts from 7–7.",
      "A player must win with a 2-point lead in one continuous run.",
      "If the score reaches 10–10 again, the game enters Sudden Death.",
      "During Deuce and Sudden Death, the serve alternates after every point.",
    ],
  },
  {
    title: "🎯 Match Order",
    points: ["The receiver of the previous game serves first in the next game."],
  },
  {
    title: "📋 Miscellaneous",
    points: [
      "The game must be played using the assigned rackets.",
      "If a player's racket touches the table during a rally, play continues.",
      "If no referee is present, the Honor System applies. Players should agree on the result or replay the point.",
    ],
  },
];

const RulesPage = () => {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-8xl rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="rounded-t-xl bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">🏓 Table Tennis Rules</h1>
          <p className="mt-2 text-blue-100">
            Quick guide for tournament matches.
          </p>
        </div>

        {/* Knockout Rule */}
        <div className="border-b bg-yellow-50 px-5 lg:px-8 py-6">
          <h2 className="mb-2 text-xl font-semibold text-yellow-700">
            ⚠️ Knockout Rule
          </h2>

          <p className="leading-7 text-gray-700">
            In an <strong>11-point game</strong>, <strong>6-0 lead</strong> and <strong>9-1 lead</strong> is
            considered a <strong>Knockout</strong>. Since a player must win by at
            least a 2-point margin, the trailing player has only five remaining
            points available and cannot recover under this tournament rule.
          </p>
        </div>

        {/* Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-5 lg:p-8">
          {rules.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 lg:p-6"
            >
              <h2 className="mb-4 text-xl font-semibold text-blue-700">
                {section.title}
              </h2>

              <ul className="list-disc space-y-2 pl-6 text-gray-700">
                {section.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>

              {section.subPoints && (
                <div className="mt-5 ml-5">
                  <ul className="list-disc space-y-3 pl-6">
                    {section.subPoints.map((item, index) => (
                      <li key={index}>
                        <span className="font-semibold">{item.title}:</span>{" "}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="rounded-b-xl bg-gray-50 px-8 py-5 text-center text-sm text-gray-500">
          Please follow the rules and maintain fair play throughout the
          tournament.
        </div>
      </div>
    </div>
  );
}

export default RulesPage;
