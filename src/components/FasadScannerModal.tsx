import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FOTO_POI, KATEGORI_LABEL, type POI } from "../data/poi";
import {
  klasifikasiFasadGedung,
  type HasilKlasifikasiFasad,
  type PrediksiGedung,
} from "../utils/fasadApi";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectPoi: (poi: POI) => void;
  onPlayNarasi: (poi: POI) => void;
};

export default function FasadScannerModal({
  visible,
  onClose,
  onSelectPoi,
  onPlayNarasi,
}: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilKlasifikasiFasad | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetState() {
    setImageUri(null);
    setLoading(false);
    setHasil(null);
    setErrorMessage(null);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function prosesGambar(pickerResult: ImagePicker.ImagePickerResult) {
    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return;
    }

    const asset = pickerResult.assets[0];
    setImageUri(asset.uri);
    setLoading(true);
    setErrorMessage(null);
    setHasil(null);

    try {
      const res = await klasifikasiFasadGedung({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
      });
      setHasil(res);
    } catch (err: any) {
      const msg =
        err?.message ||
        "Gagal mengenali fasad gedung. Pastikan koneksi internet aktif dan server Hugging Face telah aktif.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleAmbilKamera() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Izin Kamera Dibutuhkan",
          "Aplikasi membutuhkan akses ke kamera untuk mengambil foto fasad gedung."
        );
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      prosesGambar(res);
    } catch (e: any) {
      Alert.alert("Gagal Membuka Kamera", e.message || String(e));
    }
  }

  async function handlePilihGaleri() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Izin Galeri Dibutuhkan",
          "Aplikasi membutuhkan akses ke galeri untuk memilih foto fasad gedung."
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      prosesGambar(res);
    } catch (e: any) {
      Alert.alert("Gagal Membuka Galeri", e.message || String(e));
    }
  }

  function handleLihatDiPeta(prediksi: PrediksiGedung) {
    if (prediksi.poi) {
      onSelectPoi(prediksi.poi);
      handleClose();
    }
  }

  function handlePutarAudio(prediksi: PrediksiGedung) {
    if (prediksi.poi) {
      onPlayNarasi(prediksi.poi);
    }
  }

  const poiGedungUtama = hasil?.gedungUtama?.poi;
  const fotoPoi = poiGedungUtama?.foto ? FOTO_POI[poiGedungUtama.foto] : undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Cek Fasad Gedung</Text>
              <Text style={styles.headerSubtitle}>
                Identifikasi gedung ITB Jatinangor dari foto fasad
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>X</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Area Preview Foto atau Placeholder */}
            {imageUri ? (
              <View style={styles.previewCard}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  contentFit="cover"
                  transition={200}
                />
                {!loading && (
                  <View style={styles.actionRowInline}>
                    <Pressable
                      style={styles.retakeBtn}
                      onPress={handleAmbilKamera}
                    >
                      <Text style={styles.retakeBtnText}>Ambil Ulang</Text>
                    </Pressable>
                    <Pressable
                      style={styles.retakeBtn}
                      onPress={handlePilihGaleri}
                    >
                      <Text style={styles.retakeBtnText}>Pilih Foto Lain</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.placeholderCard}>
                <Text style={styles.placeholderTitle}>
                  Arahkan kamera ke fasad gedung
                </Text>
                <Text style={styles.placeholderText}>
                  Ambil foto dari sisi depan atau samping bangunan kampus agar
                  model dapat mengenali arsitektur gedung dengan jelas.
                </Text>
                <View style={styles.pickerButtonGroup}>
                  <Pressable
                    style={styles.primaryPickerBtn}
                    onPress={handleAmbilKamera}
                  >
                    <Text style={styles.primaryPickerBtnText}>
                      Buka Kamera
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryPickerBtn}
                    onPress={handlePilihGaleri}
                  >
                    <Text style={styles.secondaryPickerBtnText}>
                      Pilih dari Galeri
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2F6DB5" />
                <Text style={styles.loadingText}>
                  Menganalisis fasad gedung...
                </Text>
                <Text style={styles.loadingSubtext}>
                  Menghubungi server model bangunan ITB Jatinangor
                </Text>
              </View>
            )}

            {/* Error Container */}
            {errorMessage && !loading && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Gagal Mengidentifikasi</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <View style={styles.errorActionRow}>
                  <Pressable
                    style={styles.retryBtn}
                    onPress={handleAmbilKamera}
                  >
                    <Text style={styles.retryBtnText}>Foto Ulang</Text>
                  </Pressable>
                  <Pressable
                    style={styles.retryBtnSecondary}
                    onPress={handlePilihGaleri}
                  >
                    <Text style={styles.retryBtnSecondaryText}>Pilih dari Galeri</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Hasil Prediksi */}
            {hasil && !loading && (
              <View style={styles.resultContainer}>
                {!hasil.terverifikasi ? (
                  /* FALLBACK: Keyakinan Model Rendah (< 50%) */
                  <View style={styles.fallbackCard}>
                    <Text style={styles.fallbackBadge}>FASAD KURANG JELAS</Text>
                    <Text style={styles.fallbackTitle}>
                      Gedung Belum Dapat Dipastikan
                    </Text>
                    <Text style={styles.fallbackText}>
                      Model tidak dapat mengenali gedung dengan pasti. Foto mungkin buram, terhalang pohon/kendaraan, sudut pengambilan terlalu miring, atau pencahayaan kurang memadai.
                    </Text>

                    {poiGedungUtama && (
                      <View style={styles.guessBox}>
                        <Text style={styles.guessLabel}>Dugaan terdekat model:</Text>
                        <Text style={styles.guessName}>{hasil.gedungUtama.label}</Text>
                        <Pressable
                          style={styles.guessActionBtn}
                          onPress={() => handleLihatDiPeta(hasil.gedungUtama)}
                        >
                          <Text style={styles.guessActionBtnText}>
                            Periksa di Peta
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <View style={styles.fallbackActionGroup}>
                      <Pressable
                        style={styles.primaryPickerBtn}
                        onPress={handleAmbilKamera}
                      >
                        <Text style={styles.primaryPickerBtnText}>
                          Ambil Foto Ulang
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryPickerBtn}
                        onPress={handlePilihGaleri}
                      >
                        <Text style={styles.secondaryPickerBtnText}>
                          Pilih dari Galeri
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* NORMAL: Keyakinan Cukup (>= 50%) */
                  <>
                    <View style={styles.resultCard}>
                      <Text style={styles.resultBadge}>GEDUNG TERDETEKSI</Text>

                      <Text style={styles.resultTitle}>
                        {hasil.gedungUtama.label}
                      </Text>

                      {poiGedungUtama ? (
                        <>
                          <Text style={styles.resultCategory}>
                            {poiGedungUtama.id} · {KATEGORI_LABEL[poiGedungUtama.kategori]}
                          </Text>
                          {fotoPoi && (
                            <Image
                              source={fotoPoi}
                              style={styles.poiReferencePhoto}
                              contentFit="cover"
                            />
                          )}
                          <Text style={styles.resultDesc} numberOfLines={3}>
                            {poiGedungUtama.deskripsi}
                          </Text>

                          <View style={styles.actionButtonGroup}>
                            <Pressable
                              style={styles.mapActionBtn}
                              onPress={() => handleLihatDiPeta(hasil.gedungUtama)}
                            >
                              <Text style={styles.mapActionBtnText}>
                                Lihat di Peta
                              </Text>
                            </Pressable>

                            <Pressable
                              style={styles.audioActionBtn}
                              onPress={() => handlePutarAudio(hasil.gedungUtama)}
                            >
                              <Text style={styles.audioActionBtnText}>
                                Putar Narasi
                              </Text>
                            </Pressable>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.resultDesc}>
                          Gedung terdeteksi oleh model klasifikasi, namun belum
                          terdaftar dalam rincian POI lokal.
                        </Text>
                      )}
                    </View>

                    {/* Alternatif Prediksi (Tanpa Persentase) */}
                    {hasil.alternatif && hasil.alternatif.length > 0 && (
                      <View style={styles.alternativesSection}>
                        <Text style={styles.alternativesTitle}>
                          Kemungkinan Gedung Lain:
                        </Text>
                        {hasil.alternatif.map((item, idx) => (
                          <Pressable
                            key={idx}
                            style={styles.altItem}
                            onPress={() => {
                              if (item.poi) handleLihatDiPeta(item);
                            }}
                          >
                            <Text style={styles.altLabel}>{item.label}</Text>
                            {item.poi && (
                              <Text style={styles.altAction}>Lihat</Text>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1E33",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: "#4A5568",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  placeholderCard: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
    textAlign: "center",
  },
  placeholderText: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  pickerButtonGroup: {
    width: "100%",
    marginTop: 18,
    gap: 10,
  },
  primaryPickerBtn: {
    backgroundColor: "#2F6DB5",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryPickerBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryPickerBtn: {
    backgroundColor: "#EDF2F7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryPickerBtnText: {
    color: "#2D3748",
    fontWeight: "600",
    fontSize: 14,
  },
  previewCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F7FAFC",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },
  actionRowInline: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    alignItems: "center",
  },
  retakeBtnText: {
    fontSize: 13,
    color: "#2D3748",
    fontWeight: "600",
  },
  loadingContainer: {
    marginTop: 20,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 14,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A202C",
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#718096",
  },
  errorContainer: {
    marginTop: 16,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEB2B2",
    borderRadius: 14,
    padding: 16,
  },
  errorTitle: {
    color: "#C53030",
    fontWeight: "700",
    fontSize: 14,
  },
  errorText: {
    color: "#742A2A",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  errorActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: "#C53030",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  retryBtnSecondary: {
    flex: 1,
    backgroundColor: "#FED7D7",
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  retryBtnSecondaryText: {
    color: "#742A2A",
    fontWeight: "600",
    fontSize: 13,
  },
  resultContainer: {
    marginTop: 16,
    gap: 16,
  },
  fallbackCard: {
    backgroundColor: "#FFFAF0",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FBD38D",
  },
  fallbackBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C05621",
    letterSpacing: 0.8,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#7B341E",
    marginTop: 6,
  },
  fallbackText: {
    fontSize: 13,
    color: "#7B341E",
    lineHeight: 18,
    marginTop: 4,
  },
  guidanceBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FEEBC8",
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 4,
  },
  guidanceItem: {
    fontSize: 12,
    color: "#4A5568",
    lineHeight: 18,
  },
  guessBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guessLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#718096",
  },
  guessName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
    marginTop: 2,
  },
  guessActionBtn: {
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  guessActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2F6DB5",
  },
  fallbackActionGroup: {
    marginTop: 14,
    gap: 10,
  },
  resultCard: {
    backgroundColor: "#F0F4F8",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D2E3FC",
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2F6DB5",
    letterSpacing: 0.8,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F1E33",
    marginTop: 6,
  },
  resultCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A5568",
    marginTop: 2,
    marginBottom: 8,
  },
  poiReferencePhoto: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginVertical: 8,
  },
  resultDesc: {
    fontSize: 13,
    color: "#4A5568",
    lineHeight: 18,
  },
  actionButtonGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  mapActionBtn: {
    flex: 1,
    backgroundColor: "#2F6DB5",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  mapActionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  audioActionBtn: {
    flex: 1,
    backgroundColor: "#3D7A4E",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  audioActionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  alternativesSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  alternativesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A5568",
    marginBottom: 2,
  },
  altItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  altLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
  },
  altAction: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2F6DB5",
  },
});
