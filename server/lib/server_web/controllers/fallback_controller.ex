defmodule ServerWeb.FallbackController do
  @moduledoc """
  Translates controller action results into valid `Plug.Conn` responses.

  See `Phoenix.Controller.action_fallback/1` for more details.
  """
  use ServerWeb, :controller

  # This clause handles errors returned by Ecto's insert/update/delete.
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: ServerWeb.ChangesetJSON)
    |> render(:error, changeset: changeset)
    |> halt()
  end

  # This clause is an example of how to handle resources that cannot be found.
  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(html: ServerWeb.ErrorHTML, json: ServerWeb.ErrorJSON)
    |> render(:"404")
    |> halt()
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(html: ServerWeb.ErrorHTML, json: ServerWeb.ErrorJSON)
    |> render(:"401")
    |> halt()
  end
end
