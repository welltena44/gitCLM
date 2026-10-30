import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "./Pagination.jsx";

const items = Array.from({ length: 30 }, (_, index) => `Ligne ${index + 1}`);

function renderItems(resetKey = "initial", rows = items) {
  return render(
    <Pagination items={rows} resetKey={resetKey}>
      {(visibleItems) => (
        <ul>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </Pagination>,
  );
}

test("changes the page size and navigates through the list", () => {
  renderItems();

  expect(screen.getByText("Ligne 10")).toBeInTheDocument();
  expect(screen.queryByText("Ligne 11")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
  expect(screen.getByText("Ligne 11")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Lignes par page"), {
    target: { value: "25" },
  });
  expect(screen.getByText("Ligne 1")).toBeInTheDocument();
  expect(screen.getByText("Ligne 25")).toBeInTheDocument();
  expect(screen.queryByText("Ligne 26")).not.toBeInTheDocument();
});

test("returns to the first page when the active filter changes", () => {
  const view = renderItems();
  fireEvent.click(screen.getByRole("button", { name: "Page suivante" }));
  expect(screen.getByText("Ligne 11")).toBeInTheDocument();

  view.rerender(
    <Pagination items={items.slice(0, 12)} resetKey="filtered">
      {(visibleItems) => (
        <ul>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </Pagination>,
  );

  expect(screen.getByText("Ligne 1")).toBeInTheDocument();
  expect(screen.getByText("Page 1 / 2")).toBeInTheDocument();
});