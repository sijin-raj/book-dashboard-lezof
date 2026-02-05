"use client";

import { FaCloudUploadAlt } from "react-icons/fa";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type Offer = {
  id: number;
  title: string;
  description: string | null;
  price: string | null;
  image: {
    id: number;
    url: string;
    altText: string | null;
  } | null;
  imageAr?: {
    id: number;
    url: string;
    altText: string | null;
  } | null;
  arabicImage?: {
    id: number;
    url: string;
    altText: string | null;
  } | null;
  imageArabic?: {
    id: number;
    url: string;
    altText: string | null;
  } | null;
  service: {
    id: number;
    name: string;
  };
};

type OffersResponse = {
  success: boolean;
  data: Offer[];
};

type UpdateResponse = {
  success: boolean;
  data: {
    offerId: number;
    image: {
      id: number;
      url: string;
      altText: string | null;
    };
  };
};

type OfferImageViewResponse = {
  success: boolean;
  data: {
    offerId: number;
    grouped?: {
      desktop?: {
        en?: { url?: string; dataUrl?: string; altText?: string };
        ar?: { url?: string; dataUrl?: string; altText?: string };
      };
      mobile?: {
        en?: { url?: string; dataUrl?: string; altText?: string };
        ar?: { url?: string; dataUrl?: string; altText?: string };
      };
    };
  };
};
type ImageInput = {
  url: string;
  dataUrl: string;
  altText: string;
};

type OfferImageForm = {
  desktop: {
    en: ImageInput;
    ar: ImageInput;
  };
  mobile: {
    en: ImageInput;
    ar: ImageInput;
  };
};

const EMPTY_IMAGE_INPUT: ImageInput = {
  url: "",
  dataUrl: "",
  altText: "",
};

const DEFAULT_OFFER_IMAGE_FORM: OfferImageForm = {
  desktop: {
    en: { ...EMPTY_IMAGE_INPUT },
    ar: { ...EMPTY_IMAGE_INPUT },
  },
  mobile: {
    en: { ...EMPTY_IMAGE_INPUT },
    ar: { ...EMPTY_IMAGE_INPUT },
  },
};

const readFileAsDataUrl = (file: File, onLoad: (result: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    onLoad(result);
  };
  reader.readAsDataURL(file);
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<
    Record<number, OfferImageForm>
  >({});
  const [activeLangMap, setActiveLangMap] = useState<
    Record<number, { desktop: "en" | "ar"; mobile: "en" | "ar" }>
  >({});
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<OffersResponse>("/api/public/offers");
      setOffers(response.data);
      if (response.data.length && selectedOfferId === null) {
        setSelectedOfferId(response.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const loadOfferImages = async (offerId: number) => {
    try {
      const response = await apiFetch<OfferImageViewResponse>(
        `/api/dashboard/offers/${offerId}/image`
      );
      if (!response.data?.grouped) return;
      const grouped = response.data.grouped;
      const nextState: OfferImageForm = {
        desktop: {
          en: {
            url: grouped.desktop?.en?.url || "",
            dataUrl: grouped.desktop?.en?.dataUrl || "",
            altText: grouped.desktop?.en?.altText || "",
          },
          ar: {
            url: grouped.desktop?.ar?.url || "",
            dataUrl: grouped.desktop?.ar?.dataUrl || "",
            altText: grouped.desktop?.ar?.altText || "",
          },
        },
        mobile: {
          en: {
            url: grouped.mobile?.en?.url || "",
            dataUrl: grouped.mobile?.en?.dataUrl || "",
            altText: grouped.mobile?.en?.altText || "",
          },
          ar: {
            url: grouped.mobile?.ar?.url || "",
            dataUrl: grouped.mobile?.ar?.dataUrl || "",
            altText: grouped.mobile?.ar?.altText || "",
          },
        },
      };
      setFormState((prev) => ({ ...prev, [offerId]: nextState }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    }
  };

  useEffect(() => {
    if (selectedOfferId === null) return;
    loadOfferImages(selectedOfferId);
  }, [selectedOfferId]);

  const handleDeleteImages = async (
    offerId: number,
    options: { device?: "desktop" | "mobile"; locale?: "en" | "ar" }
  ) => {
    const params = new URLSearchParams();
    if (options.device) params.set("device", options.device);
    if (options.locale) params.set("locale", options.locale);
    const query = params.toString();
    const url = query
      ? `/api/dashboard/offers/${offerId}/image?${query}`
      : `/api/dashboard/offers/${offerId}/image`;

    const confirmed = window.confirm(
      options.device || options.locale
        ? "Delete selected images?"
        : "Delete all images for this offer?"
    );
    if (!confirmed) return;

    try {
      await apiFetch<{ success: boolean }>(url, { method: "DELETE" });
      await loadOfferImages(offerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete images");
    }
  };

  const handleChange = (
    offerId: number,
    target: "desktop" | "mobile",
    lang: "en" | "ar",
    field: "url" | "dataUrl" | "altText",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [offerId]: {
        ...(prev[offerId] || DEFAULT_OFFER_IMAGE_FORM),
        [target]: {
          ...(prev[offerId]?.[target] || DEFAULT_OFFER_IMAGE_FORM[target]),
          [lang]: {
            ...(prev[offerId]?.[target]?.[lang] ||
              DEFAULT_OFFER_IMAGE_FORM[target][lang]),
            [field]: value,
          },
        },
      },
    }));
  };

  const handleFileUpload = (
    offerId: number,
    target: "desktop" | "mobile",
    lang: "en" | "ar",
    file: File | null
  ) => {
    if (!file) return;
    readFileAsDataUrl(file, (result) => {
      setFormState((prev) => ({
        ...prev,
        [offerId]: {
          ...(prev[offerId] || DEFAULT_OFFER_IMAGE_FORM),
          [target]: {
            ...(prev[offerId]?.[target] || DEFAULT_OFFER_IMAGE_FORM[target]),
            [lang]: {
              ...(prev[offerId]?.[target]?.[lang] ||
                DEFAULT_OFFER_IMAGE_FORM[target][lang]),
              url: "",
              dataUrl: result,
            },
          },
        },
      }));
    });
  };

  const getPreviewSrc = (input: ImageInput) => input.dataUrl || input.url || "";

  const handleUrlChange = (
    offerId: number,
    target: "desktop" | "mobile",
    lang: "en" | "ar",
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [offerId]: {
        ...(prev[offerId] || DEFAULT_OFFER_IMAGE_FORM),
        [target]: {
          ...(prev[offerId]?.[target] || DEFAULT_OFFER_IMAGE_FORM[target]),
          [lang]: {
            ...(prev[offerId]?.[target]?.[lang] ||
              DEFAULT_OFFER_IMAGE_FORM[target][lang]),
            url: value,
            dataUrl: value ? "" : prev[offerId]?.[target]?.[lang]?.dataUrl || "",
          },
        },
      },
    }));
  };

  const buildImagePayload = (input: ImageInput) => {
    const payload: { url?: string; dataUrl?: string; altText?: string } = {};
    if (input.url) {
      payload.url = input.url;
    } else if (input.dataUrl) {
      payload.dataUrl = input.dataUrl;
    }
    if ((payload.url || payload.dataUrl) && input.altText) {
      payload.altText = input.altText;
    }
    return payload.url || payload.dataUrl ? payload : null;
  };

  const handleUpdate = async () => {
    if (selectedOfferId === null) return;
    const state = formState[selectedOfferId] || DEFAULT_OFFER_IMAGE_FORM;
    const desktopEn = buildImagePayload(state.desktop.en);
    const desktopAr = buildImagePayload(state.desktop.ar);
    const mobileEn = buildImagePayload(state.mobile.en);
    const mobileAr = buildImagePayload(state.mobile.ar);
    const payload: {
      desktop?: { en?: typeof desktopEn; ar?: typeof desktopAr };
      mobile?: { en?: typeof mobileEn; ar?: typeof mobileAr };
    } = {};

    if (desktopEn || desktopAr) {
      payload.desktop = {};
      if (desktopEn) payload.desktop.en = desktopEn;
      if (desktopAr) payload.desktop.ar = desktopAr;
    }

    if (mobileEn || mobileAr) {
      payload.mobile = {};
      if (mobileEn) payload.mobile.en = mobileEn;
      if (mobileAr) payload.mobile.ar = mobileAr;
    }

    if (!payload.desktop && !payload.mobile) {
      setError("Please provide at least one image URL or upload.");
      return;
    }

    try {
      await apiFetch<UpdateResponse>(
        `/api/dashboard/offers/${selectedOfferId}/image`,
        {
        method: "PUT",
        body: JSON.stringify(payload),
        }
      );
      await fetchOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update image");
    }
  };

  return (
    <section>
      <h1 className="section-title">Offer Images</h1>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <div className="card offer-image-card" style={{ marginTop: 18 }}>
        {offers.length ? (
          <div className="offer-image-layout">
            <label className="offer-select">
              Offer
              <select
                className="select"
                value={selectedOfferId ?? ""}
                onChange={(event) =>
                  setSelectedOfferId(
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              >
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.title}
                  </option>
                ))}
              </select>
            </label>
            {selectedOfferId !== null ? (
              <>
                <div className="banner-grid offer-banner-grid">
                  {(["desktop", "mobile"] as const).map((target) => {
                    const lang =
                      activeLangMap[selectedOfferId]?.[target] || "en";
                    const state =
                      formState[selectedOfferId] || DEFAULT_OFFER_IMAGE_FORM;
                    const inputState = state[target][lang];
                    const preview = getPreviewSrc(inputState);
                    return (
                      <div key={target} className="banner-card">
                        <h4 className="banner-card-title">
                          {target === "desktop"
                            ? "Desktop view banner"
                            : "Mobile view banner"}
                        </h4>
                        <div className="lang-tabs offer-lang-tabs">
                          <button
                            type="button"
                            className={`lang-tab offer-lang-tab ${
                              lang === "en" ? "is-active" : ""
                            }`}
                            onClick={() =>
                              setActiveLangMap((prev) => ({
                                ...prev,
                                [selectedOfferId]: {
                                  desktop:
                                    prev[selectedOfferId]?.desktop || "en",
                                  mobile: prev[selectedOfferId]?.mobile || "en",
                                  [target]: "en",
                                },
                              }))
                            }
                          >
                            English
                          </button>
                          <button
                            type="button"
                            className={`lang-tab offer-lang-tab ${
                              lang === "ar" ? "is-active" : ""
                            }`}
                            onClick={() =>
                              setActiveLangMap((prev) => ({
                                ...prev,
                                [selectedOfferId]: {
                                  desktop:
                                    prev[selectedOfferId]?.desktop || "en",
                                  mobile: prev[selectedOfferId]?.mobile || "en",
                                  [target]: "ar",
                                },
                              }))
                            }
                          >
                            Arabic
                          </button>
                        </div>
                        <div className="offer-upload-box">
                          {preview ? (
                            <img
                              src={preview}
                              alt={inputState.altText || "Offer image"}
                              className="offer-preview"
                            />
                          ) : null}
                          <div className="upload-header">
                            <h5>Upload Photos</h5>
                           
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              className="icon-button icon-button-outline icon-button-text"
                              onClick={() =>
                                handleDeleteImages(selectedOfferId, {
                                  device: target,
                                  locale: lang,
                                })
                              }
                              aria-label={`Delete ${lang.toUpperCase()} image`}
                              title={`Delete ${lang.toUpperCase()}`}
                            >
                              🗑 <span>Delete {lang.toUpperCase()}</span>
                            </button>
                            <button
                              type="button"
                              className="icon-button icon-button-outline icon-button-text"
                              onClick={() =>
                                handleDeleteImages(selectedOfferId, {
                                  device: target,
                                })
                              }
                              aria-label={`Delete ${target} images`}
                              title={`Delete ${target}`}
                            >
                              🗑 <span>Delete {target}</span>
                            </button>
                          </div>
                          <label className="upload-dropzone">
                            <input
                              type="file"
                              className="upload-input"
                              accept="image/*"
                              onChange={(event) =>
                                handleFileUpload(
                                  selectedOfferId,
                                  target,
                                  lang,
                                  event.target.files?.[0] || null
                                )
                              }
                            />
                            <FaCloudUploadAlt className="upload-fa" />
                            <p>
                              Drop your image here, or{" "}
                              <span className="upload-link">browse</span>
                            </p>
                            <p className="upload-hint">
                              Supports: PNG, JPG, JPEG, WEBP
                            </p>
                          </label>
                          <input
                            className="input"
                            placeholder="Image URL (optional)"
                            value={inputState.url}
                            onChange={(event) =>
                              handleUrlChange(
                                selectedOfferId,
                                target,
                                lang,
                                event.target.value
                              )
                            }
                          />
                          <p className="muted" style={{ marginTop: 6 }}>
                            If uploads fail due to request size, paste an image
                            URL instead.
                          </p>
                          <input
                            className="input"
                            placeholder={
                              lang === "en" ? "Alt text" : "Arabic alt text"
                            }
                            value={inputState.altText}
                            onChange={(event) =>
                              handleChange(
                                selectedOfferId,
                                target,
                                lang,
                                "altText",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="icon-button icon-button-text"
                    onClick={handleUpdate}
                    aria-label="Save images"
                    title="Save"
                  >
                    ✓ <span>Save</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button-outline icon-button-text"
                    style={{ marginLeft: 12 }}
                    onClick={() =>
                      selectedOfferId !== null
                        ? handleDeleteImages(selectedOfferId, {})
                        : null
                    }
                    aria-label="Delete all images"
                    title="Delete all"
                  >
                    🗑 <span>Delete all</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <p className="muted">No offers available.</p>
        )}
      </div>
    </section>
  );
}
