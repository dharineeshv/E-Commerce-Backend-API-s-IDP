export function getSpecifications() {

    const specifications = {};

    document.querySelectorAll(".spec-row").forEach((row) => {

        const key = row
            .querySelector(".spec-name-input")
            .value
            .trim();

        const value = row
            .querySelector(".spec-value-input")
            .value
            .trim();

        if (key && value) {

            specifications[key] = value;

        }

    });

    return specifications;

}
