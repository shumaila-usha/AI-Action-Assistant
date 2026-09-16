document.addEventListener(
    "DOMContentLoaded",
    function () {

        const missionSection =
            document.getElementById(
                "daily-mission-section"
            );

        const takeawayBoxes =
            document.querySelectorAll(
                ".mission-takeaway"
            );

        const resetButton =
            document.getElementById(
                "reset-progress"
            );

        if (
            !missionSection ||
            takeawayBoxes.length === 0
        ) {
            return;
        }

        const goal =
            missionSection.dataset.goal ||
            "default-goal";

        const missionDate =
            missionSection.dataset.date ||
            new Date()
                .toISOString()
                .slice(0, 10);

        const safeGoalKey =
            goal
                .toLowerCase()
                .trim()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                );

        const storageKey =
            "mission-takeaways-" +
            safeGoalKey +
            "-" +
            missionDate;


        function getTakeawayData() {

            return Array.from(
                takeawayBoxes
            ).map(
                function (box) {

                    return {
                        missionId:
                            box.dataset.missionId,
                        text:
                            box.value
                    };
                }
            );
        }


        function saveTakeaways() {

            localStorage.setItem(
                storageKey,
                JSON.stringify(
                    getTakeawayData()
                )
            );
        }


        function loadTakeaways() {

            const saved =
                localStorage.getItem(
                    storageKey
                );

            if (!saved) {
                return;
            }

            try {

                const savedTakeaways =
                    JSON.parse(saved);

                takeawayBoxes.forEach(
                    function (box, index) {

                        if (
                            savedTakeaways[index]
                        ) {
                            box.value =
                                savedTakeaways[index]
                                    .text || "";
                        }
                    }
                );

            } catch (error) {

                console.log(
                    "Could not load takeaways:",
                    error
                );
            }
        }


        takeawayBoxes.forEach(
            function (box) {

                box.addEventListener(
                    "input",
                    saveTakeaways
                );
            }
        );


        if (resetButton) {

            resetButton.addEventListener(
                "click",
                function () {

                    localStorage.removeItem(
                        storageKey
                    );

                    takeawayBoxes.forEach(
                        function (box) {

                            box.value = "";
                        }
                    );
                }
            );
        }


        loadTakeaways();
    }
);