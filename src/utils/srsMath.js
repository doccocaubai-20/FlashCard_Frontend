export function calculateNextReview(rating, currentInterval = 0, currentEase = 2.5, currentRepetitions = 0) {
    const quality = Math.min(5, Math.max(0, rating));
    const easeFactor = Math.max(
        1.3,
        currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    let repetitions = currentRepetitions;
    let interval;

    if (quality < 3) {
        repetitions = 0;
        interval = 1;
    } else {
        repetitions += 1;

        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(currentInterval * easeFactor) || 1;
        }
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        interval,
        easeFactor: Number(easeFactor.toFixed(2)),
        repetitions,
        nextReviewDate,
    };
}
