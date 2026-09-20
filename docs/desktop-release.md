# macOS 배포 서명과 Apple 공증

macOS에서 개발자를 확인할 수 없거나 Apple이 악성 소프트웨어 여부를 확인할 수 없다는 경고는 기존 배포가 ad-hoc 서명만 사용하고 Apple 공증을 비활성화했기 때문입니다. 정상적인 외부 배포에는 Apple Developer Program 계정의 **Developer ID Application** 인증서와 Apple 공증이 필요합니다.

## 최초 설정

GitHub 저장소의 **Settings → Secrets and variables → Actions → New repository secret**에 다음 값을 등록합니다. 인증서와 암호는 저장소 파일이나 채팅에 넣지 않습니다.

| Secret | 값 |
| --- | --- |
| `MAC_CSC_LINK` | 개인 키를 포함해 내보낸 Developer ID Application `.p12` 파일의 Base64 문자열 |
| `MAC_CSC_KEY_PASSWORD` | `.p12` 파일을 내보낼 때 지정한 암호 |
| `APPLE_ID` | Apple Developer 계정 이메일 |
| `APPLE_APP_SPECIFIC_PASSWORD` | 해당 Apple 계정에서 생성한 앱 전용 암호 (계정 로그인 암호 아님) |
| `APPLE_TEAM_ID` | 인증서를 발급한 Apple Developer 팀 ID |

1. Apple Developer의 Certificates에서 **Developer ID Application** 인증서를 발급하고 Mac 키체인에 설치합니다. App Store용 Apple Distribution 인증서와는 다릅니다.
2. 키체인 접근의 나의 인증서에서 인증서와 개인 키를 `.p12`로 내보내고 암호를 지정합니다.
3. 다음 명령으로 Base64 값을 클립보드에 복사해 `MAC_CSC_LINK`에 붙여 넣습니다. 경로는 실제 인증서 파일로 바꿉니다.

   ```sh
   base64 -i /path/to/developer-id-application.p12 | pbcopy
   ```

4. [Apple 계정](https://account.apple.com/)에서 앱 전용 암호를 생성하고 나머지 Secrets를 등록합니다.
5. 변경 사항을 `main`에 반영하면 Release desktop 워크플로가 실행됩니다. 이미 반영했다면 Actions에서 해당 워크플로를 `main` 기준으로 수동 실행합니다.

## 배포 시 검증

macOS 빌드는 자격 증명 누락 시 즉시 실패합니다. electron-builder가 Hardened Runtime을 활성화하고 Developer ID로 서명한 뒤 Apple 공증을 요청하고 공증 티켓을 앱에 첨부합니다. Electron의 JIT 실행 권한은 `apps/desktop/build/entitlements.mac.plist`에서 지정합니다.

업로드 전에 실제 DMG를 읽기 전용으로 마운트하고 내부 앱에 대해 다음을 검사합니다.

- `codesign --verify --deep --strict`: 앱과 내부 코드의 서명 무결성
- `xcrun stapler validate`: 공증 티켓 첨부 여부
- `spctl --assess --type execute`: Gatekeeper 실행 허용 여부

검증에 실패한 DMG는 업로드하지 않으며, 모든 플랫폼 빌드가 성공해야 GitHub Release를 게시합니다. Apple 공증 대기 시간을 고려해 빌드 제한 시간은 90분입니다.

이미 내려받은 기존 DMG에는 변경이 적용되지 않습니다. 새 Release의 DMG로 앱을 교체해야 합니다. 최종 확인은 다른 Mac에서 브라우저로 새 DMG를 내려받아 설치하고 실행합니다. 일반적인 최초 실행 확인창은 표시될 수 있으나, 개발자 미확인 경고를 해제하기 위한 보안 설정 변경은 필요하지 않아야 합니다.

Windows 배포는 이번 수정 대상이 아니며 기존 미서명 설정을 유지합니다.

참고: [Electron 코드 서명](https://www.electronjs.org/docs/latest/tutorial/code-signing), [electron-builder macOS 공증](https://www.electron.build/v26/docs/notarization/).
